// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Fields, Files, File } from "formidable";

import { dbConnect } from "@/lib/dbConnect";
import { requireAuth } from "@/lib/api/requireAuth";

import { parseForm } from "@/lib/api/parseForm";
import { buildFileContent } from "@/lib/api/buildFileContent";
import { buildChatMessages } from "@/lib/api/buildChatMessages";
import { callOpenAIVision } from "@/lib/api/callOpenAIVision";
import { audioToText } from "@/lib/api/audioToText";

import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

import type { ChatMessage, FileContentPart } from "@/components/types/chatTypes";

export const config = {
  api: { bodyParser: false }, // 🔴 REQUIRED for Formidable
};

interface SuccessResponse {
  conversationId: string;
  reply: string;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = requireAuth(req);
    await dbConnect();

    const apiKey = process.env.AZURE_OPENAI_API_KEY ?? "";
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Azure API key" });
    }

    // ✅ Parse multipart form
    const [fields, files]: [Fields, Files] = await parseForm(req);

    const content: string | undefined = fields.message?.[0];
    const conversationId: string | undefined = fields.conversationId?.[0];
    const uploadedFile: File | undefined = files.file?.[0] as File | undefined;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Invalid content" });
    }

    // ✅ Find or create conversation
    let conversation;

    if (conversationId) {
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
        title: content.slice(0, 30),
      });
    }

    // ✅ Handle files (audio / image / docs)
    let fileParts: FileContentPart[] = [];

    if (uploadedFile) {
      const mime = uploadedFile.mimetype ?? "";

      if (mime.startsWith("audio/")) {
        const transcript = await audioToText(uploadedFile);
        fileParts.push({
          type: "text",
          text: transcript,
        });
      } else {
        fileParts = buildFileContent(uploadedFile);
      }
    }

    // ✅ Save USER message
    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content,
    });

    // ✅ Build OpenAI messages
    const chatMessages: ChatMessage[] = buildChatMessages(content, fileParts);

    // ✅ Call Azure OpenAI Vision
    const reply: string = await callOpenAIVision(apiKey, chatMessages);

    // ✅ Save ASSISTANT message
    await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: reply,
    });

    return res.status(200).json({
      conversationId: conversation._id.toString(),
      reply,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.error("chat.ts error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}