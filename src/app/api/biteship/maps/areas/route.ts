import { NextResponse } from "next/server"
import { searchAreas } from "@/lib/biteship"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const input = searchParams.get("input")

  if (!input || input.length < 2) {
    return NextResponse.json({ areas: [] })
  }

  try {
    const data = await searchAreas(input)
    return NextResponse.json(data.areas || [])
  } catch (error) {
    console.error("Biteship maps error:", error)
    return NextResponse.json({ error: "Gagal mencari area" }, { status: 500 })
  }
}
