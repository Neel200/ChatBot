// proxy.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_API_ROUTES = [
  "/api/auth/signup",
  "/api/auth/login",
  "/api/chat"
];

function hasAuth(request: NextRequest): boolean {
  const cookieToken = request.cookies.get("token")?.value;
  const authHeader = request.headers.get("authorization");

  return Boolean(cookieToken || authHeader?.startsWith("Bearer "));
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow public auth APIs
  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Protect other API routes. The frontend stores the JWT in localStorage and
  // sends it as an Authorization header, so checking only cookies blocks saved
  // chat APIs before their handlers can load conversations from MongoDB.
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/chat")){
    if (!hasAuth(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}
