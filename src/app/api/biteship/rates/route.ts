import { NextResponse } from "next/server"
import { getRates, getOriginPostalCode } from "@/lib/biteship"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { destinationPostalCode, couriers, items } = data

    if (!destinationPostalCode) {
      return NextResponse.json({ error: "Kode pos tujuan wajib diisi" }, { status: 400 })
    }

    const originPostalCode = data.originPostalCode || getOriginPostalCode()

    const result = await getRates({
      originPostalCode,
      destinationPostalCode,
      couriers: couriers || "jne,jnt,sicepat,anteraja",
      items: items || [],
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Biteship rates error:", error)
    return NextResponse.json(
      { error: error.message || "Gagal menghitung ongkir" },
      { status: 500 }
    )
  }
}
