import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/dbConnect";
import { Conversation } from "@/models/Conversation";
import { requireAuth } from "@/lib/api/requireAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const userId = requireAuth(req);
  if (!userId) return;

  await dbConnect();

  if (req.method === "POST") {
    const conversation = await Conversation.create({
      userId,
      title: "New chat",
      createdAt: new Date(),
    });

    res.status(201).json({ id: conversation._id });
    return;
  }


  if (req.method === "GET") {
    const conversations = await Conversation.find({ userId })
      .sort({ createdAt: -1 })
      .select("_id title createdAt");

    res.status(200).json(conversations);
    return;
  }

  res.status(405).end();
}