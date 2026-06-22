import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const pathname = req.nextUrl.pathname

  // Public routes
  const publicPaths = ["/auth/login", "/auth/register", "/api/auth"]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // Protected paths
  const protectedPaths = ["/dashboard", "/admin", "/checkout"]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = token.role as string

    // Admin routes - only ADMIN/SUPERADMIN
    if (pathname.startsWith("/admin") && role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Customer dashboard - only CUSTOMER
    if (pathname.startsWith("/dashboard") && role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/checkout",
  ],
}
