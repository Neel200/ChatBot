// pages/api/conversations/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/dbConnect";
import { requireAuth } from "@/lib/api/requireAuth";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  conversation: unknown;
  messages: unknown[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  try {
    const userId = requireAuth(req);
    await dbConnect();

    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    res.status(200).json({ conversation, messages });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.error("conversation fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}