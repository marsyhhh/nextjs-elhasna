"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { Search, Package, RefreshCw } from "lucide-react"

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Belum Dibayar", PROCESSING: "Diproses",
  SHIPPED: "Dikirim", DELIVERED: "Selesai", CANCELLED: "Dibatalkan",
}
const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch { console.error("Failed to fetch orders") }
    setLoading(false)
  }

  const filtered = orders.filter(
    (o) =>
      o.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesanan</h1>
          <p className="text-sm text-slate-500 mt-0.5">{orders.length} total pesanan</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Cari pesanan..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map((order) => (
          <Link key={order.id} href={`/admin/orders/${order.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">{order.invoiceNumber}</span>
                    <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                  </div>
                  <Badge variant="outline" className={statusColors[order.status] || ""}>{statusLabels[order.status] || order.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{order.user?.name || order.user?.email}</span>
                  <span className="font-semibold text-slate-900">{formatPrice(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>Tidak ada pesanan</p>
          </div>
        )}
        {loading && <p className="text-center text-slate-400 py-8">Memuat...</p>}
      </div>
    </div>
  )
}
