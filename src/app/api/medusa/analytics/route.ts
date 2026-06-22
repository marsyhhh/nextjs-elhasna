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

export async function GET() {
  try {
    const token = await getAdminToken()

    // Fetch orders + products from Medusa
    const [ordersRes, productsRes] = await Promise.all([
      fetch(`${MEDUSA_BACKEND_URL}/admin/orders?limit=100`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }),
      fetch(`${MEDUSA_BACKEND_URL}/admin/products?limit=100`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }),
    ])

    const orders = (await ordersRes.json()).orders || []
    const products = (await productsRes.json()).products || []

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const paidOrders = orders.filter(
      (o: any) => o.payment_status === "captured" || o.status === "completed"
    )

    const dailyRevenue = paidOrders
      .filter((o: any) => new Date(o.created_at) >= startOfDay)
      .reduce((sum: number, o: any) => sum + o.total, 0)

    const weeklyRevenue = paidOrders
      .filter((o: any) => new Date(o.created_at) >= startOfWeek)
      .reduce((sum: number, o: any) => sum + o.total, 0)

    const monthlyRevenue = paidOrders
      .filter((o: any) => new Date(o.created_at) >= startOfMonth)
      .reduce((sum: number, o: any) => sum + o.total, 0)

    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + o.total, 0)

    const ordersByStatus: Record<string, number> = {}
    orders.forEach((o: any) => {
      const s = o.fulfillment_status || o.status
      ordersByStatus[s] = (ordersByStatus[s] || 0) + 1
    })

    // Revenue chart - 7 hari
    const revenueChart: { date: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(d.getDate() + 1)
      const rev = paidOrders
        .filter((o: any) => new Date(o.created_at) >= d && new Date(o.created_at) < next)
        .reduce((sum: number, o: any) => sum + o.total, 0)
      revenueChart.push({
        date: d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
        revenue: rev,
      })
    }

    return NextResponse.json({
      analytics: {
        totalRevenue,
        totalOrders: paidOrders.length,
        averageOrderValue: paidOrders.length > 0
          ? Math.round(totalRevenue / paidOrders.length) : 0,
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        ordersByStatus,
        totalProducts: products.length,
        recentOrders: orders.slice(0, 5).map((o: any) => ({
          id: o.id,
          total: o.total,
          invoiceNumber: o.display_id ? `#${o.display_id}` : o.id.slice(0, 8),
        })),
        revenueChart,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics from Medusa" },
      { status: 500 }
    )
  }
}
