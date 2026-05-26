import type {
  ChatMessage,
  TextContent,
  ImageUrlContent,
} from "@/components/types/chatTypes";

interface DBMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function buildChatMessages(
  previousMessages: DBMessage[],
  userText: string | undefined,
  fileParts: (TextContent | ImageUrlContent)[]
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // 1️⃣ Add previous messages (chat memory)
  for (const msg of previousMessages) {
    messages.push({
      role: msg.role,
      content: [
        {
          type: "text",
          text: msg.content,
        },
      ],
    });
  }

  // 2️⃣ Build current user content blocks
  const contentBlocks: (TextContent | ImageUrlContent)[] = [];

  if (userText && userText.trim().length > 0) {
    contentBlocks.push({
      type: "text",
      text: userText,
    });
  }

  if (fileParts.length > 0) {
    for (const part of fileParts) {
      contentBlocks.push(part);
    }
  }

  // 3️⃣ Add current user message
  messages.push({
    role: "user",
    content: contentBlocks,
  });

  return messages;
}