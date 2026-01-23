// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { User } from "@/models/User";
import { dbConnect } from "@/lib/dbConnect";
import mongoose from "mongoose";

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  success: true;
}

type ApiResponse = ErrorResponse | SuccessResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    await dbConnect();

    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPassword,
    });

    res.status(201).json({ success: true });
  } catch (error: unknown) {
    console.error("SIGNUP ERROR:", error);

    if (error instanceof mongoose.Error && "code" in error) {
      if ((error as mongoose.mongo.MongoServerError).code === 11000) {
        res.status(409).json({ error: "User already exists" });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
}