import { NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

async function getAdminToken() {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  })
  if (!res.ok) throw new Error("Medusa auth failed")
  const data = await res.json()
  return data.token
}

export async function GET(request: Request) {
  try {
    const token = await getAdminToken()
    const { searchParams } = new URL(request.url)
    const qs = searchParams.toString()

    const res = await fetch(
      `${MEDUSA_BACKEND_URL}/admin/orders${qs ? `?${qs}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders from Medusa" },
      { status: 500 }
    )
  }
}
