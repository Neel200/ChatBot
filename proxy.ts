// proxy.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_API_ROUTES = [
  "/api/auth/signup",
  "/api/auth/login",
  "/api/chat"
];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow public auth APIs
  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Protect other API routes
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/chat")){
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}