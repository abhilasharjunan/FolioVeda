import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isProtected = request.nextUrl.pathname.startsWith("/dashboard") ||
                     request.nextUrl.pathname.startsWith("/portfolio") ||
                     request.nextUrl.pathname.startsWith("/funds") ||
                     request.nextUrl.pathname.startsWith("/top-funds") ||
                     request.nextUrl.pathname.startsWith("/risk-analysis");

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/portfolio/:path*", "/funds/:path*", "/top-funds/:path*", "/risk-analysis/:path*", "/auth/:path*"],
};
