import type { FileData } from "@/components/types/chatTypes";

type MessageRole = "user" | "assistant";

interface SavedMessageDoc {
  _id: unknown;
  role: MessageRole;
  content: string;
  createdAt?: Date | string;
  file?: {
    name?: string;
    mimeType?: string;
  };
}

export interface SavedChatMessage {
  _id: string;
  role: "user" | "bot";
  text: string;
  createdAt?: string;
  file?: FileData;
}

export function formatSavedMessage(message: SavedMessageDoc): SavedChatMessage {
  const file =
    message.file?.name && message.file.mimeType
      ? {
          name: message.file.name,
          mimeType: message.file.mimeType,
        }
      : undefined;

  return {
    _id: String(message._id),
    role: message.role === "assistant" ? "bot" : "user",
    text: message.content,
    createdAt: message.createdAt
      ? new Date(message.createdAt).toISOString()
      : undefined,
    file,
  };
}
