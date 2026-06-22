import { NextResponse } from "next/server"

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY
const RAJAONGKIR_BASE_URL = "https://api.rajaongkir.com/starter"

const courierNames: Record<string, string> = {
  jne: "JNE",
  jnt: "J&T Express",
  pos: "POS Indonesia",
  sicepat: "SiCepat",
}

const fallbackRates: Record<string, { regRate: number; regEtd: string; kargoRate: number; kargoEtd: string }> = {
  jne: { regRate: 8000, regEtd: "2-3", kargoRate: 6000, kargoEtd: "5-7" },
  jnt: { regRate: 7500, regEtd: "2-3", kargoRate: 5500, kargoEtd: "4-6" },
  pos: { regRate: 5000, regEtd: "3-5", kargoRate: 4000, kargoEtd: "7-10" },
  sicepat: { regRate: 9000, regEtd: "1-2", kargoRate: 7000, kargoEtd: "3-5" },
}

async function fetchFromRajaOngkir(origin: string, destination: string, weight: string, courier: string) {
  if (!RAJAONGKIR_API_KEY) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/cost`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        key: RAJAONGKIR_API_KEY!,
      },
      body: new URLSearchParams({ origin, destination, weight, courier }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const data = await response.json()
    if (data.rajaongkir?.status?.code !== 200) return null

    const results = data.rajaongkir.results[0]
    return results.costs.map((cost: { service: string; description: string; cost: { value: number; etd: string }[] }) => ({
      service: cost.service,
      description: cost.description,
      cost: cost.cost[0].value,
      etd: cost.cost[0].etd,
    }))
  } catch {
    return null
  }
}

function calculateFallback(weight: number, courier: string) {
  const rate = fallbackRates[courier] || fallbackRates.jne
  const weightKg = Math.max(1, Math.ceil(weight / 1000))

  return [
    {
      service: "REG",
      description: "Layanan Reguler",
      cost: weightKg * rate.regRate,
      etd: rate.regEtd,
    },
    {
      service: "KARGO",
      description: "Layanan Kargo",
      cost: weightKg * rate.kargoRate,
      etd: rate.kargoEtd,
    },
  ]
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const origin = searchParams.get("origin") || "501"
  const destination = searchParams.get("destination")
  const weight = searchParams.get("weight") || "1000"
  const courier = searchParams.get("courier") || "jne"

  if (!destination) {
    return NextResponse.json({ error: "Destination is required" }, { status: 400 })
  }

  const services = await fetchFromRajaOngkir(origin, destination, weight, courier)

  if (!services) {
    console.log("RajaOngkir unreachable, using fallback shipping cost")
    const weightNum = parseInt(weight, 10) || 1000
    return NextResponse.json({
      courier: courierNames[courier] || courier.toUpperCase(),
      origin,
      destination,
      weight,
      services: calculateFallback(weightNum, courier),
      note: "Biaya ongkir adalah estimasi (RajaOngkir tidak terjangkau)",
    })
  }

  return NextResponse.json({
    courier: courierNames[courier] || courier.toUpperCase(),
    origin,
    destination,
    weight,
    services,
  })
}
