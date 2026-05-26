import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/dbConnect";
import { Conversation } from "@/models/Conversation";
import { requireAuth } from "@/lib/api/requireAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  //const userId = requireAuth(req);
  //if (!userId) return;
  let userId: string;

  try {
    userId = requireAuth(req);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }


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
    const conversations = await Conversation.find({
      userId,
      archivedAt: null,
    })
      .sort({ updatedAt: -1 })
      .select("_id title createdAt updatedAt archivedAt");

    res.status(200).json(conversations);
    return;
  }

  res.status(405).end();
}
