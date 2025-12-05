import type { NextApiRequest, NextApiResponse } from "next";
import type { Fields, Files, File } from "formidable";

import { parseForm } from "@/lib/api/parseForm";
import { buildFileContent } from "@/lib/api/buildFileContent";
import { buildChatMessages } from "@/lib/api/buildChatMessages";
import { callOpenAIVision } from "@/lib/api/callOpenAIVision";
import { audioToText } from "@/lib/api/audioToText";

import type { ChatMessage, FileContentPart } from "@/components/types/chatTypes";

export const config = {
  api: { bodyParser: false }
};

export default async function chat(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Only POST is allowed
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const apiKey: string = process.env.AZURE_OPENAI_API_KEY ?? "";
  if (!apiKey) {
    res.status(500).json({ reply: "Missing Azure API key" });
    return;
  }

  // Parse FormData using Formidable
  const [fields, files]: [Fields, Files] = await parseForm(req);

  const msg: string | undefined = fields.message?.[0];

  const uploadedFile: File | undefined = files.file?.[0] as File | undefined;

  let fileParts: FileContentPart[] = [];

  if (uploadedFile) {
    const mime = uploadedFile.mimetype ?? "";

    // 🎤 AUDIO FILE → Convert using Whisper/Azure STT
    if (mime.startsWith("audio/")) {
      const transcript = await audioToText(uploadedFile);
      fileParts.push({
        type: "text",
        text: transcript
      });
    } 
    // 🖼 IMAGE / 📄 TEXT DOCUMENT
    else {
      fileParts = buildFileContent(uploadedFile);
    }
  }

  // Build final message array for Azure/OpenAI
  const chatMessages: ChatMessage[] = buildChatMessages(msg, fileParts);

  // Call Azure / OpenAI Vision endpoint
  const reply: string = await callOpenAIVision(apiKey, chatMessages);

  res.status(200).json({ reply });
}