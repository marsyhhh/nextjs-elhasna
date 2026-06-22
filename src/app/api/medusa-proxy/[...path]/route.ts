import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathname = path.join("/")
  const searchParams = new URL(request.url).searchParams.toString()
  const qs = searchParams ? `?${searchParams}` : ""

  const targetUrl = `${MEDUSA_BACKEND_URL}/app/${pathname}${qs}`
  const method = request.method

  // Build body for methods that support it
  let body: BodyInit | undefined
  const contentType = request.headers.get("content-type") || ""
  if (method !== "GET" && method !== "HEAD") {
    if (contentType.includes("json")) {
      body = await request.text()
    } else {
      body = await request.arrayBuffer()
    }
  }

  const headers = new Headers()
  // Forward auth cookies
  const cookie = request.headers.get("Cookie")
  if (cookie) headers.set("Cookie", cookie)

  // Forward authorization
  const auth = request.headers.get("Authorization")
  if (auth) headers.set("Authorization", auth)

  // Forward accept/content-type
  const accept = request.headers.get("Accept")
  if (accept) headers.set("Accept", accept)
  if (contentType) headers.set("Content-Type", contentType)

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual",
    })

    const responseBody = await response.arrayBuffer()
    const responseContentType = response.headers.get("content-type") || ""

    const proxyResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": responseContentType,
        "Cache-Control": "no-store",
      },
    })

    // Forward cookies
    const setCookie = response.headers.get("set-cookie")
    if (setCookie) {
      proxyResponse.headers.set("set-cookie", setCookie)
    }

    // Handle redirects (e.g. /app/ → /app/login)
    const location = response.headers.get("location")
    if (location && response.status >= 300 && response.status < 400) {
      const rewritten = location.replace(MEDUSA_BACKEND_URL + "/app", "/api/medusa-proxy")
      proxyResponse.headers.set("location", rewritten)
    }

    // Rewrite asset paths in HTML
    if (responseContentType.includes("text/html")) {
      const decoder = new TextDecoder()
      let html = decoder.decode(responseBody)
      html = html.replace(
        new RegExp(MEDUSA_BACKEND_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "/app", "g"),
        "/api/medusa-proxy"
      )
      return new NextResponse(html, {
        status: response.status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      })
    }

    return proxyResponse
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        error: "Medusa backend tidak tersedia",
        detail: error instanceof Error ? error.message : "Connection failed",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
export const PATCH = proxyRequest
export const OPTIONS = proxyRequest
