import { NextResponse } from "next/server"
import { provinces as staticProvinces } from "@/lib/rajaongkir-data"

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY
const RAJAONGKIR_BASE_URL = "https://api.rajaongkir.com/starter"

export async function GET() {
  if (RAJAONGKIR_API_KEY) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const url = `${RAJAONGKIR_BASE_URL}/province?key=${RAJAONGKIR_API_KEY}`
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (response.ok) {
        const data = await response.json()
        if (data.rajaongkir?.status?.code === 200) {
          const provinces = data.rajaongkir.results.map((p: { province_id: string; province: string }) => ({
            id: p.province_id,
            name: p.province,
          }))
          return NextResponse.json(provinces)
        }
      }
    } catch {
      console.log("RajaOngkir unreachable, using static province data")
    }
  }

  return NextResponse.json(staticProvinces)
}
