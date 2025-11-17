import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const { message } = req.body;
  if (!message) {
    res.status(400).json({ message: "Message required" });
    return;
  }

  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ message: "Missing API key" });
    return;
  }

  try {
    const response = await fetch(
      "https://vision-demo-shopline.openai.azure.com/openai/deployments/gpt-4.1-vishon-demo-shopline/chat/completions?api-version=2025-01-01-preview",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content || "No response";

    res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error calling Azure OpenAI API" });
  }
}