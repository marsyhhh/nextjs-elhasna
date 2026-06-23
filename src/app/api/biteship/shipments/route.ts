import { NextResponse } from "next/server"
import {
  createShipment,
  getOriginPostalCode,
  getOriginContactName,
  getOriginContactPhone,
  getOriginAddress,
} from "@/lib/biteship"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { destinationPostalCode, courier, courierService, items } = data

    if (!destinationPostalCode || !courier || !courierService) {
      return NextResponse.json({ error: "Data pengiriman tidak lengkap" }, { status: 400 })
    }

    const result = await createShipment({
      originPostalCode: data.originPostalCode || getOriginPostalCode(),
      originContactName: getOriginContactName(),
      originContactPhone: getOriginContactPhone(),
      originAddress: getOriginAddress(),
      destinationPostalCode,
      destinationContactName: data.destinationContactName || "Customer",
      destinationContactPhone: data.destinationContactPhone || "",
      destinationAddress: data.destinationAddress || "",
      courier,
      courierService,
      items: items || [],
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Biteship create shipment error:", error)
    return NextResponse.json(
      { error: error.message || "Gagal membuat pengiriman" },
      { status: 500 }
    )
  }
}
