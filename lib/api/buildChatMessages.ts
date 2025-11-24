import type { ChatMessage, TextContent, ImageUrlContent } from "@/components/types/chatTypes";

export function buildChatMessages(
  userText: string | undefined,
  fileParts: (TextContent | ImageUrlContent)[]
): ChatMessage[] {

  const contentBlocks: (TextContent | ImageUrlContent)[] = [];

  // Add user text if present
  if (userText && userText.trim().length > 0) {
    contentBlocks.push({
      type: "text",
      text: userText
    });
  }

  // Add file content
  if (fileParts.length > 0) {
    for (const part of fileParts) {
      contentBlocks.push(part);
    }
  }

  return [
    {
      role: "user",
      content: contentBlocks
    }
  ];
}
