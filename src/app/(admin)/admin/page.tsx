"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { ShoppingBag, Package, Users, DollarSign, AlertTriangle, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

function pad(n: number): string {
  return n.toString().padStart(2, "0")
}

function getWeekDateRange(val: string): { start: Date; end: Date } | null {
  const m = val.match(/^(\d{4})-W(\d{2})$/)
  if (!m) return null
  const year = Number(m[1]), week = Number(m[2])
  const jan4 = new Date(year, 0, 4)
  const dayOffset = (jan4.getDay() + 6) % 7
  const ms = jan4.getTime() - dayOffset * 86400000 + (week - 1) * 7 * 86400000
  const monday = new Date(ms)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

function getCurrentWeekStr(): string {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const dayOffset = (jan4.getDay() + 6) % 7
  const ms = now.getTime() - jan4.getTime() + dayOffset * 86400000
  const week = Math.ceil(ms / (7 * 86400000))
  return `${now.getFullYear()}-W${pad(week)}`
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const isPemilik = session?.user?.role === "PEMILIK"

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCustomers: 0 })
  const [pendingShipments, setPendingShipments] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [weeklyChart, setWeeklyChart] = useState<{ day: string; thisWeek: number; lastWeek: number }[]>([])
  const [weekRevenue, setWeekRevenue] = useState(0)
  const [lastWeekRevenue, setLastWeekRevenue] = useState(0)
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [lastMonthRevenue, setLastMonthRevenue] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/users?role=customer").then((r) => r.json()),
    ])
      .then(([products, orders, users]) => {
        const prodArr = Array.isArray(products) ? products : []
        const ordArr = Array.isArray(orders) ? orders : []
        const userArr = Array.isArray(users) ? users : []

        const isPaid = (o: any) => o.paymentStatus === "SUCCESS" || o.status === "DELIVERED"

        // Stats
        const revenue = ordArr.filter(isPaid).reduce((s: number, o: any) => s + o.total, 0)
        setStats({
          totalProducts: prodArr.length,
          totalOrders: ordArr.length,
          totalRevenue: revenue,
          totalCustomers: userArr.length,
        })

        // Pending shipments: PROCESSING without waybill
        setPendingShipments(
          ordArr.filter((o: any) => o.status === "PROCESSING" && !o.biteshipWaybillId).slice(0, 5)
        )

        // Low stock: check variant combinations first, then product-level stock
        const lowStock: any[] = []
        prodArr.forEach((p: any) => {
          if (p.combinations?.length) {
            p.combinations.forEach((c: any) => {
              const stock = c.stock ?? 0
              if (stock < 20) {
                const labels: string[] = []
                if (c.variant1) labels.push(`${c.variant1.type}: ${c.variant1.name}`)
                if (c.variant2) labels.push(`${c.variant2.type}: ${c.variant2.name}`)
                lowStock.push({
                  id: c.id,
                  productId: p.id,
                  name: `${p.name} (${labels.join(", ")})`,
                  stock,
                })
              }
            })
          } else {
            const stock = p.stock ?? 0
            if (stock < 20) {
              lowStock.push({
                id: p.id,
                productId: p.id,
                name: p.name,
                stock,
              })
            }
          }
        })
        setLowStockProducts(
          lowStock.sort((a: any, b: any) => a.stock - b.stock).slice(0, 5)
        )

        // Top products: by soldCount
        setTopProducts(
          [...prodArr].sort((a: any, b: any) => b.soldCount - a.soldCount).slice(0, 5)
        )

        // Weekly comparison chart
        const now = new Date()
        const getDate = (o: any) => o.paidAt ? new Date(o.paidAt) : o.updatedAt ? new Date(o.updatedAt) : new Date(o.createdAt)

        const thisWeekStr = getCurrentWeekStr()
        const thisWeekRange = getWeekDateRange(thisWeekStr)
        const lastWeekParts = thisWeekStr.match(/^(\d{4})-W(\d{2})$/)
        const lastWeekNum = lastWeekParts ? `${lastWeekParts[1]}-W${pad(parseInt(lastWeekParts[2]) - 1)}` : thisWeekStr
        const lastWeekRange = getWeekDateRange(lastWeekNum)

        const chart: { day: string; thisWeek: number; lastWeek: number }[] = []
        let twRev = 0, lwRev = 0

        for (let i = 0; i < 7; i++) {
          if (!thisWeekRange || !lastWeekRange) break
          const dayStart = new Date(thisWeekRange.start)
          dayStart.setDate(dayStart.getDate() + i)
          const dayEnd = new Date(dayStart)
          dayEnd.setHours(23, 59, 59, 999)

          const lDayStart = new Date(lastWeekRange.start)
          lDayStart.setDate(lDayStart.getDate() + i)
          const lDayEnd = new Date(lDayStart)
          lDayEnd.setHours(23, 59, 59, 999)

          const tw = ordArr.filter(isPaid).filter((o: any) => {
            const d = getDate(o)
            return d >= dayStart && d <= dayEnd
          }).reduce((s: number, o: any) => s + o.total, 0)

          const lw = ordArr.filter(isPaid).filter((o: any) => {
            const d = getDate(o)
            return d >= lDayStart && d <= lDayEnd
          }).reduce((s: number, o: any) => s + o.total, 0)

          chart.push({ day: DAYS[i], thisWeek: tw, lastWeek: lw })
          twRev += tw
          lwRev += lw
        }

        setWeeklyChart(chart)
        setWeekRevenue(twRev)
        setLastWeekRevenue(lwRev)

        // Month comparison
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

        setMonthRevenue(
          ordArr.filter(isPaid).filter((o: any) => {
            const d = getDate(o)
            return d >= startMonth
          }).reduce((s: number, o: any) => s + o.total, 0)
        )

        setLastMonthRevenue(
          ordArr.filter(isPaid).filter((o: any) => {
            const d = getDate(o)
            return d >= startLastMonth && d <= endLastMonth
          }).reduce((s: number, o: any) => s + o.total, 0)
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function pctChange(current: number, previous: number): { pct: number; direction: "up" | "down" | "flat" } {
    if (previous === 0) return current > 0 ? { pct: 100, direction: "up" } : { pct: 0, direction: "flat" }
    const pct = Math.round(((current - previous) / previous) * 100)
    return { pct, direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" }
  }

  const cards = [
    { title: "Total Produk", value: stats.totalProducts, icon: ShoppingBag, color: "text-blue-600 bg-blue-100", href: "/admin/products" },
    { title: "Total Pesanan", value: stats.totalOrders, icon: Package, color: "text-purple-600 bg-purple-100", href: "/admin/orders" },
    { title: "Pendapatan", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "text-green-600 bg-green-100" },
    { title: "Pelanggan", value: stats.totalCustomers, icon: Users, color: "text-amber-600 bg-amber-100" },
  ]

  const weekCmp = pctChange(weekRevenue, lastWeekRevenue)
  const monthCmp = pctChange(monthRevenue, lastMonthRevenue)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          const content = (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">{loading ? "..." : card.value}</p>
              </CardContent>
            </Card>
          )
          return card.href ? <Link key={card.title} href={card.href}>{content}</Link> : content
        })}
      </div>

      {/* Line Chart - This Week vs Last Week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-900">Perbandingan Penjualan Mingguan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Memuat...</div>
          ) : weeklyChart.every((d) => d.thisWeek === 0 && d.lastWeek === 0) ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Belum ada data penjualan</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weeklyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v: number) => formatPrice(v)} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Legend />
                <Line type="monotone" dataKey="thisWeek" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Minggu Ini" />
                <Line type="monotone" dataKey="lastWeek" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Minggu Lalu" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Period Comparison Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400">Minggu Ini vs Minggu Lalu</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-lg font-bold">...</p>
            ) : (
              <div className="flex items-end gap-3">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatPrice(weekRevenue)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Minggu lalu: {formatPrice(lastWeekRevenue)}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium mb-1 ${weekCmp.direction === "up" ? "text-green-600" : weekCmp.direction === "down" ? "text-red-600" : "text-slate-400"}`}>
                  {weekCmp.direction === "up" ? <TrendingUp className="h-4 w-4" /> : weekCmp.direction === "down" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {weekCmp.pct > 0 ? "+" : ""}{weekCmp.pct}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400">Bulan Ini vs Bulan Lalu</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-lg font-bold">...</p>
            ) : (
              <div className="flex items-end gap-3">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatPrice(monthRevenue)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Bulan lalu: {formatPrice(lastMonthRevenue)}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium mb-1 ${monthCmp.direction === "up" ? "text-green-600" : monthCmp.direction === "down" ? "text-red-600" : "text-slate-400"}`}>
                  {monthCmp.direction === "up" ? <TrendingUp className="h-4 w-4" /> : monthCmp.direction === "down" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {monthCmp.pct > 0 ? "+" : ""}{monthCmp.pct}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Three Column Lists */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Pending Shipments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-500" /> Pesanan Butuh Tindakan
              </CardTitle>
              <Badge variant="outline" className="text-xs">{pendingShipments.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-400">Memuat...</p>
            ) : pendingShipments.length === 0 ? (
              <p className="text-sm text-slate-400">Tidak ada</p>
            ) : (
              <div className="space-y-2">
                {pendingShipments.map((o: any) => {
                  const item = (
                    <div className="flex items-center justify-between text-sm -mx-2 px-2 py-1 rounded">
                      <div>
                        <p className="font-medium text-slate-700">{o.invoiceNumber}</p>
                        <p className="text-xs text-slate-400">{o.user?.name || o.user?.email}</p>
                      </div>
                      {!isPemilik && <ArrowRight className="h-3.5 w-3.5 text-slate-300" />}
                    </div>
                  )
                  return isPemilik
                    ? <div key={o.id} className="hover:bg-slate-50 transition-colors">{item}</div>
                    : <Link key={o.id} href={`/admin/orders/${o.id}`} className="hover:bg-slate-50 transition-colors">{item}</Link>
                })}
                {!isPemilik && <Link href="/admin/orders" className="block text-xs text-primary mt-2 hover:underline">Lihat semua</Link>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Stok Menipis
              </CardTitle>
              <Badge variant="outline" className="text-xs">{lowStockProducts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-400">Memuat...</p>
            ) : lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-400">Semua stok aman</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p: any) => {
                  const stockColor = p.stock === 0
                    ? "bg-red-50 text-red-700 border-red-200"
                    : p.stock <= 5
                      ? "bg-red-50 text-red-600 border-red-200"
                      : p.stock <= 10
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  return isPemilik
                    ? (
                      <div key={p.id} className={`flex items-center justify-between text-sm rounded px-2 py-1.5 border ${stockColor}`}>
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="font-bold ml-2">{p.stock}</span>
                      </div>
                    )
                    : (
                      <Link key={p.id} href={`/admin/products/${p.productId}/edit`} className={`flex items-center justify-between text-sm rounded px-2 py-1.5 border ${stockColor} hover:opacity-80 transition-opacity`}>
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="font-bold ml-2">{p.stock}</span>
                      </Link>
                    )
                })}
                {!isPemilik && <Link href="/admin/products" className="block text-xs text-primary mt-2 hover:underline">Lihat semua</Link>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" /> Produk Terlaris
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-400">Memuat...</p>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada data</p>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-slate-100 text-slate-500" : i === 2 ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-400"}`}>{i + 1}</span>
                    <span className="text-slate-700 truncate flex-1">{p.name}</span>
                    <span className="text-slate-500 text-xs">{p.soldCount} terjual</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      {!isPemilik && (
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/products">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Kelola Produk</p>
                  <p className="text-sm text-slate-500">Tambah, edit, hapus produk fashion</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Kelola Pesanan</p>
                  <p className="text-sm text-slate-500">Update status & input resi pengiriman</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  )
}
