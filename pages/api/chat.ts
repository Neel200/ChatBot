// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Fields, Files, File } from "formidable";
import mongoose from "mongoose";

import { dbConnect } from "@/lib/dbConnect";
import { requireAuth } from "@/lib/api/requireAuth";

import { parseForm } from "@/lib/api/parseForm";
import { buildFileContent } from "@/lib/api/buildFileContent";
import { buildChatMessages } from "@/lib/api/buildChatMessages";
import { callOpenAIVision } from "@/lib/api/callOpenAIVision";
import { audioToText } from "@/lib/api/audioToText";
import { formatSavedMessage } from "@/lib/api/formatSavedMessage";
import { generateConversationTitle } from "@/lib/api/generateConversationTitle";

import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

import type { ChatMessage, FileContentPart } from "@/components/types/chatTypes";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let userId: string;
    try {
      userId = requireAuth(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await dbConnect();

    const apiKey = process.env.AZURE_OPENAI_API_KEY ?? "";
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Azure API key" });
    }

    const [fields, files]: [Fields, Files] = await parseForm(req);

    const rawContent = Array.isArray(fields.message)
      ? fields.message[0]
      : fields.message;
    const conversationId = Array.isArray(fields.conversationId)
      ? fields.conversationId[0]
      : fields.conversationId;
    const uploadedFile = Array.isArray(files.file)
      ? (files.file[0] as File | undefined)
      : (files.file as File | undefined);
    const content = typeof rawContent === "string" ? rawContent.trim() : "";

    if (!content && !uploadedFile) {
      return res.status(400).json({ error: "Message or file is required" });
    }

    let conversation;
    const isNewConversation = !conversationId;
    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation id" });
      }

      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      conversation = await Conversation.create({
        userId,
        title: "New chat",
      });
    }

    let fileParts: FileContentPart[] = [];
    if (uploadedFile) {
      const mime = uploadedFile.mimetype ?? "";

      if (mime.startsWith("audio/")) {
        const transcript = await audioToText(uploadedFile);
        fileParts.push({ type: "text", text: transcript });
      } else {
        fileParts = buildFileContent(uploadedFile);
      }
    }

    const dbMessages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .select("role content -_id");

    const chatMessages: ChatMessage[] = buildChatMessages(
      dbMessages,
      content,
      fileParts
    );

    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: content || `Attached ${uploadedFile?.originalFilename ?? "file"}`,
      file: uploadedFile
        ? {
            name: uploadedFile.originalFilename ?? "file",
            mimeType: uploadedFile.mimetype ?? "application/octet-stream",
          }
        : undefined,
    });

    const reply = await callOpenAIVision(apiKey, chatMessages);

    if (isNewConversation) {
      conversation.title = await generateConversationTitle(
        apiKey,
        content,
        reply,
        uploadedFile?.originalFilename ?? undefined
      );
    }

    await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: reply,
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    const savedMessages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      conversationId: conversation._id.toString(),
      reply,
      messages: savedMessages.map(formatSavedMessage),
    });
  } catch (error) {
    console.error("chat.ts error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
