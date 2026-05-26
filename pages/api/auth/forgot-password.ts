// pages/api/auth/forgot-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";

interface Response { message: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  await dbConnect();

  // Always return the same message — never reveal whether the email exists
  const genericMessage = "If an account with that email exists, we've sent a password reset link.";

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(200).json({ message: genericMessage });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  try {
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (err) {
    console.error("Failed to send reset email:", err);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    return res.status(500).json({ message: "Failed to send email. Please try again." });
  }

  return res.status(200).json({ message: genericMessage });
}
