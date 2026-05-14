import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware — handles CORS preflight and security headers.
 * Runs before route handlers for all /api/* paths.
 */
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";

  // Allowed origins for CORS
  const allowedOrigins = [
    process.env.DESIGNER_EXTENSION_URL || "http://localhost:1337",
    "https://webflow.com",
  ];

  // Check if origin is allowed (also allow same-origin/no-origin requests)
  const isAllowed =
    !origin || allowedOrigins.some((allowed) => origin.startsWith(allowed));

  // Handle CORS preflight (OPTIONS)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin || "*" : "",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next();

  if (isAllowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

// Only run middleware on API routes
export const config = {
  matcher: "/api/:path*",
};
