// lib/requireAuth.ts
import type { NextApiRequest } from "next";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthPayload extends JwtPayload {
  userId: string;
}

export function requireAuth(req: NextApiRequest): string {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET as string
  ) as AuthPayload;

  if (!decoded.userId) {
    throw new Error("UNAUTHORIZED");
  }

  return decoded.userId;
}