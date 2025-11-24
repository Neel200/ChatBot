import type { NextApiRequest, NextApiResponse } from "next";
import type { Fields, Files, File } from "formidable";

import { parseForm } from "@/lib/api/parseForm";
import { buildFileContent } from "@/lib/api/buildFileContent";
import { buildChatMessages } from "@/lib/api/buildChatMessages";
import { callOpenAIVision } from "@/lib/api/callOpenAIVision";

import type { ChatMessage } from "@/components/types/chatTypes";

export const config = {
  api: { bodyParser: false }
};

export default async function chat(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const apiKey: string = process.env.AZURE_OPENAI_API_KEY ?? "";
  if (!apiKey) {
    res.status(500).json({ reply: "Missing Azure API key" });
    return;
  }

  // Fully typed parseForm result
  const [fields, files]: [Fields, Files] = await parseForm(req);

  const msg: string | undefined = fields.message?.[0];
  const file: File | undefined = files.file?.[0] as File | undefined;

  const fileParts = file ? buildFileContent(file) : [];

  const chat: ChatMessage[] = buildChatMessages(msg, fileParts);

  const reply: string = await callOpenAIVision(apiKey, chat);

  res.status(200).json({ reply });
}