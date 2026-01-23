// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";

interface LoginResponse {
  token: string;
}

interface ErrorResponse {
  error: string;
}

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

  const user = await User.findOne({ email: email.toLowerCase() }); // ✅ normalize
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const isValid: boolean = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const secret: string | undefined = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT secret missing" });
    return;
  }

  const token: string = jwt.sign(
    { userId: user._id.toString() },
    secret,
    { expiresIn: "7d" }
  );

  res.status(200).json({ token });
}