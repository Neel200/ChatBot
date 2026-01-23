import type { ChatMessage } from "@/components/types/chatTypes";
import type {
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResponse
} from "@/components/types/chatTypes";

export async function callOpenAIVision(
  apiKey: string,
  messages: ChatMessage[]
): Promise<string> {

  const body: OpenAIChatCompletionRequest = {
    messages,
    max_tokens: 1000,
    temperature: 0
  };

  const response = await fetch(
    "https://vision-demo-shopline.openai.azure.com/openai/deployments/gpt-4.1-vision-demo-shopline/chat/completions?api-version=2024-02-15-preview",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    throw new Error("OpenAI API error: " + (await response.text()));
  }

  const data: OpenAIChatCompletionResponse = await response.json();

  return data.choices[0]?.message?.content ?? "No response";
}