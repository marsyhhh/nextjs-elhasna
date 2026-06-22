import { NextResponse } from "next/server"
import { cities as staticCities } from "@/lib/rajaongkir-data"

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY
const RAJAONGKIR_BASE_URL = "https://api.rajaongkir.com/starter"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const provinceId = searchParams.get("province")

  if (RAJAONGKIR_API_KEY) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      let url = `${RAJAONGKIR_BASE_URL}/city?key=${RAJAONGKIR_API_KEY}`
      if (provinceId) {
        url += `&province=${provinceId}`
      }

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (response.ok) {
        const data = await response.json()
        if (data.rajaongkir?.status?.code === 200) {
          const cities = data.rajaongkir.results.map((c: { city_id: string; city_name: string; province_id: string; postal_code: string; type: string }) => ({
            id: c.city_id,
            name: `${c.type} ${c.city_name}`,
            provinceId: c.province_id,
            postalCode: c.postal_code,
          }))
          return NextResponse.json(cities)
        }
      }
    } catch {
      console.log("RajaOngkir unreachable, using static city data")
    }
  }

  const result = provinceId
    ? staticCities.filter((c) => c.provinceId === provinceId)
    : staticCities

  return NextResponse.json(result)
}
