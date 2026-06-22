import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const pathname = req.nextUrl.pathname

  const protectedPaths = ["/dashboard", "/admin", "/checkout"]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = token.role as string

    if (pathname.startsWith("/admin")) {
      if (role === "CUSTOMER") {
        return NextResponse.redirect(new URL("/", req.url))
      }

      if (
        (pathname.startsWith("/admin/analytics") || pathname.startsWith("/admin/content")) &&
        role !== "SUPERADMIN"
      ) {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/checkout"],
}
