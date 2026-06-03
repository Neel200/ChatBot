import type { ChatMessage } from "@/components/types/chatTypes";
import type {
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResponse
} from "@/components/types/chatTypes";

const ENDPOINT =
  "https://vision-demo-shopline.openai.azure.com/openai/deployments/gpt-4.1-vishon-demo-shopline/chat/completions?api-version=2025-01-01-preview";

// Non-streaming — used for title generation
export async function callOpenAIVision(
  apiKey: string,
  messages: ChatMessage[]
): Promise<string> {
  const body: OpenAIChatCompletionRequest = {
    messages,
    max_tokens: 1000,
    temperature: 0,
  };

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("OpenAI API error: " + (await response.text()));
  }

  const data: OpenAIChatCompletionResponse = await response.json();
  return data.choices[0]?.message?.content ?? "No response";
}

// Streaming — used for the main chat response
export async function streamOpenAIVision(
  apiKey: string,
  messages: ChatMessage[]
): Promise<Response> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({ messages, max_tokens: 1000, temperature: 0, stream: true }),
  });

  if (!response.ok) {
    throw new Error("OpenAI API error: " + (await response.text()));
  }

  return response;
}