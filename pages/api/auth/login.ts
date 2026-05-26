// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";

interface LoginResponse { token: string }
interface ErrorResponse { error: string; unverified?: boolean }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse | ErrorResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  await dbConnect();

  const { email, password }: { email?: string; password?: string } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.isEmailVerified) {
    // Old accounts (created before email verification was added) have
    // isEmailVerified=false but no verification token — auto-verify them.
    if (!user.emailVerificationToken) {
      user.isEmailVerified = true;
      await user.save();
    } else {
      res.status(403).json({
        error: "Please verify your email before logging in. Check your inbox for the verification link.",
        unverified: true,
      });
      return;
    }
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT secret missing" });
    return;
  }

  const token = jwt.sign({ userId: user._id.toString() }, secret, { expiresIn: "7d" });

  res.status(200).json({ token });
}
