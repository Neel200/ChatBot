// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";

import { User } from "@/models/User";
import { dbConnect } from "@/lib/dbConnect";
import { sendVerificationEmail } from "@/lib/email";

interface ErrorResponse  { error: string }
interface SuccessResponse { success: true; message: string }
type ApiResponse = ErrorResponse | SuccessResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase() }).exec();
    if (existingUser) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await User.create({
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: "Account created. Please check your email to verify your account.",
    });
  } catch (error: unknown) {
    console.error("SIGNUP ERROR:", error);

    if (error instanceof mongoose.Error && "code" in error) {
      if ((error as mongoose.mongo.MongoServerError).code === 11000) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
}
