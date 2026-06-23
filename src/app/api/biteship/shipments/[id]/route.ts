import { NextResponse } from "next/server"
import { getShipment, getTracking } from "@/lib/biteship"
import { auth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    const [shipment, tracking] = await Promise.all([
      getShipment(id),
      getTracking(id).catch(() => null),
    ])

    return NextResponse.json({ shipment, tracking })
  } catch (error: any) {
    console.error("Biteship shipment detail error:", error)
    return NextResponse.json(
      { error: error.message || "Gagal memuat detail pengiriman" },
      { status: 500 }
    )
  }
}
