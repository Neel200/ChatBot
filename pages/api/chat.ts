// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Fields, Files, File } from "formidable";
import mongoose from "mongoose";

import { dbConnect } from "@/lib/dbConnect";
import { requireAuth } from "@/lib/api/requireAuth";
import { parseForm } from "@/lib/api/parseForm";
import { buildFileContent } from "@/lib/api/buildFileContent";
import { buildChatMessages } from "@/lib/api/buildChatMessages";
import { streamOpenAIVision } from "@/lib/api/callOpenAIVision";
import { audioToText } from "@/lib/api/audioToText";
import { generateConversationTitle } from "@/lib/api/generateConversationTitle";

import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

import type { ChatMessage, FileContentPart } from "@/components/types/chatTypes";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const rawContent = Array.isArray(fields.message) ? fields.message[0] : fields.message;
    const conversationId = Array.isArray(fields.conversationId) ? fields.conversationId[0] : fields.conversationId;
    const uploadedFile = Array.isArray(files.file) ? (files.file[0] as File | undefined) : (files.file as File | undefined);
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
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      conversation = await Conversation.create({ userId, title: "New chat" });
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

    const dbMessages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .select("role content -_id");

    const chatMessages: ChatMessage[] = buildChatMessages(dbMessages, content, fileParts);

    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: content || `Attached ${uploadedFile?.originalFilename ?? "file"}`,
      file: uploadedFile
        ? { name: uploadedFile.originalFilename ?? "file", mimeType: uploadedFile.mimetype ?? "application/octet-stream" }
        : undefined,
    });

    // --- Start streaming response ---
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const azureRes = await streamOpenAIVision(apiKey, chatMessages);
    const reader = azureRes.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let sseBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split("\n");
      sseBuffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const token: string = json.choices?.[0]?.delta?.content ?? "";
          if (token) {
            fullText += token;
            // Send each token as a JSON line so the client can parse safely
            res.write(JSON.stringify({ t: token }) + "\n");
          }
        } catch { /* ignore malformed SSE lines */ }
      }
    }

    // Save assistant message and update conversation after stream ends
    await Message.create({ conversationId: conversation._id, role: "assistant", content: fullText });

    if (isNewConversation) {
      conversation.title = await generateConversationTitle(
        apiKey, content, fullText, uploadedFile?.originalFilename ?? undefined
      );
    }
    conversation.updatedAt = new Date();
    await conversation.save();

    // Send final metadata so the client knows the conversation ID
    res.end(JSON.stringify({ done: true, conversationId: conversation._id.toString() }) + "\n");

  } catch (error) {
    console.error("chat.ts error:", error);
    // If headers already sent (streaming started), we can't send a JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.end();
    }
  }
}
