import type {
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResponse,
} from "@/components/types/chatTypes";

const TITLE_ENDPOINT =
  "https://vision-demo-shopline.openai.azure.com/openai/deployments/gpt-4.1-vishon-demo-shopline/chat/completions?api-version=2025-01-01-preview";

function cleanTitle(title: string): string {
  return title
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function fallbackTitle(userText: string, fileName?: string): string {
  if (fileName && !userText) return `Review ${fileName}`.slice(0, 60);

  const text = userText.toLowerCase();
  if (text.includes("pwa")) return "Add PWA Config";
  if (text.includes("login") || text.includes("auth")) return "Fix Authentication";
  if (text.includes("save") || text.includes("conversation")) return "Fix Saved Chats";
  if (text.includes("deploy")) return "Deployment Setup";
  if (text.includes("database") || text.includes("mongo")) return "Database Update";

  const words = userText
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 5);

  if (words.length === 0) return "New Chat";

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .slice(0, 60);
}

export async function generateConversationTitle(
  apiKey: string,
  userText: string,
  assistantReply: string,
  fileName?: string
): Promise<string> {
  const fallback = fallbackTitle(userText, fileName);

  try {
    const body: OpenAIChatCompletionRequest = {
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text:
                "Create a concise, action-oriented chat title. Use 2 to 6 words. Do not copy the user's exact question. Return only the title.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `User request:\n${userText || fileName || "Uploaded file"}\n\nAssistant response:\n${assistantReply.slice(0, 800)}`,
            },
          ],
        },
      ],
      max_tokens: 24,
      temperature: 0.2,
    };

    const response = await fetch(TITLE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) return fallback;

    const data: OpenAIChatCompletionResponse = await response.json();
    const title = cleanTitle(data.choices[0]?.message?.content ?? "");

    return title || fallback;
  } catch {
    return fallback;
  }
}
