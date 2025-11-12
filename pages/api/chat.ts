import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== "POST"){
    res.status(405).json({ message: "Method not allowed" });
    return;
  }
  const { message } = req.body;
  if (!message){
    res.status(400).json({ message: "Message required" });
    return;
  }
  const apiKey=process.env.GEMINI_API_KEY;
  if (!apiKey){
    res.status(500).json({ message: "Missing API key" });
    return;
  }
  try{
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      }
    );
    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    res.status(200).json({ reply });
  } 
  catch (error){
    console.error(error);
    res.status(500).json({ message: "Error calling Gemini API" });
  }
}   