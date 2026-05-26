// pages/api/conversations/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

import { dbConnect } from "@/lib/dbConnect";
import { requireAuth } from "@/lib/api/requireAuth";
import { formatSavedMessage } from "@/lib/api/formatSavedMessage";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!["GET", "PATCH", "DELETE"].includes(req.method ?? "")) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let userId: string;
    try {
      userId = requireAuth(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await dbConnect();

    const { id } = req.query;
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (req.method === "PATCH") {
      const { action } = req.body as { action?: string };

      if (action !== "archive" && action !== "unarchive") {
        return res.status(400).json({ error: "Invalid action" });
      }

      conversation.archivedAt = action === "archive" ? new Date() : null;
      await conversation.save();

      return res.status(200).json({ conversation });
    }

    if (req.method === "DELETE") {
      await Message.deleteMany({ conversationId: conversation._id });
      await Conversation.deleteOne({ _id: conversation._id, userId });

      return res.status(200).json({ success: true });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      conversation,
      messages: messages.map(formatSavedMessage),
    });
  } catch (error) {
    console.error("conversation fetch error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
