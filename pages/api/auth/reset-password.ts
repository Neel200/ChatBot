// pages/api/auth/reset-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";

interface SuccessResponse { success: true }
interface ErrorResponse  { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !password) {
    return res.status(400).json({ error: "Token and new password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  await dbConnect();

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ error: "This reset link is invalid or has expired" });
  }

  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return res.status(200).json({ success: true });
}
