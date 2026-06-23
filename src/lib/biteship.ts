const BITESHIP_BASE = "https://api.biteship.com/v1"

function getApiKey() {
  const key = process.env.BITESHIP_API_KEY
  if (!key || key === "biteship_live_xxx") {
    throw new Error("BITESHIP_API_KEY belum dikonfigurasi")
  }
  return key
}

export function getOriginPostalCode() {
  return process.env.BITESHIP_ORIGIN_POSTAL_CODE || "40396"
}

async function biteshipFetch(path: string, options: RequestInit = {}) {
  const apiKey = getApiKey()
  const url = `${BITESHIP_BASE}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    const detail = data.message || data.error || JSON.stringify(data)
    throw new Error(`Biteship API error ${res.status}: ${detail}`)
  }

  return data
}

export async function searchAreas(input: string) {
  return biteshipFetch(`/maps/areas?countries=ID&input=${encodeURIComponent(input)}&type=single`)
}

export async function getAreaDetail(areaId: string) {
  return biteshipFetch(`/maps/areas/${areaId}`)
}

interface RateItem {
  name: string
  description?: string
  value: number
  length?: number
  width?: number
  height?: number
  weight: number
  quantity: number
}

interface RateParams {
  originPostalCode: string
  destinationPostalCode: string
  couriers: string
  items: RateItem[]
}

export async function getRates(params: RateParams) {
  return biteshipFetch("/rates/couriers", {
    method: "POST",
    body: JSON.stringify({
      origin_postal_code: parseInt(params.originPostalCode),
      destination_postal_code: parseInt(params.destinationPostalCode),
      couriers: params.couriers,
      items: params.items,
    }),
  })
}

interface ShipmentParams {
  originPostalCode: string
  originContactName: string
  originContactPhone: string
  originAddress: string
  destinationPostalCode: string
  destinationContactName: string
  destinationContactPhone: string
  destinationAddress: string
  courier: string
  courierService: string
  items: RateItem[]
}

export async function createShipment(params: ShipmentParams) {
  return biteshipFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      origin_contact_name: params.originContactName,
      origin_contact_phone: params.originContactPhone,
      origin_address: params.originAddress,
      origin_postal_code: parseInt(params.originPostalCode),
      destination_contact_name: params.destinationContactName,
      destination_contact_phone: params.destinationContactPhone,
      destination_address: params.destinationAddress,
      destination_postal_code: parseInt(params.destinationPostalCode),
      courier_company: params.courier,
      courier_type: params.courierService,
      delivery_type: "now",
      items: params.items,
    }),
  })
}

export function getOriginContactName() {
  return process.env.BITESHIP_ORIGIN_CONTACT_NAME || "Toko"
}

export function getOriginContactPhone() {
  return process.env.BITESHIP_ORIGIN_CONTACT_PHONE || "08123456789"
}

export function getOriginAddress() {
  return process.env.BITESHIP_ORIGIN_ADDRESS || ""
}

export const BITESHIP_STATUS_MAP: Record<string, string> = {
  confirmed: "PROCESSING",
  allocating: "PROCESSING",
  allocated: "PROCESSING",
  picking: "PROCESSING",
  pickingUp: "PROCESSING",
  picked: "PROCESSING",
  packed: "PROCESSING",
  dropping: "SHIPPED",
  droppingOff: "SHIPPED",
  dropped: "SHIPPED",
  shipping: "SHIPPED",
  inTransit: "SHIPPED",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
  rejected: "CANCELLED",
  courierNotFound: "PROCESSING",
  returnInTransit: "SHIPPED",
  returned: "DELIVERED",
  disposed: "CANCELLED",
  onHold: "PROCESSING",
}

export function mapBiteshipStatus(biteshipStatus: string | null | undefined) {
  return BITESHIP_STATUS_MAP[biteshipStatus ?? ""] || null
}

export async function getShipment(waybillId: string) {
  return biteshipFetch(`/shipments/${waybillId}`)
}

export async function getTracking(waybillId: string) {
  return biteshipFetch(`/trackings/${waybillId}`)
}

export async function getOrder(orderId: string) {
  return biteshipFetch(`/orders/${orderId}`)
}
