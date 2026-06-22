"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { ShoppingBag, Package, Users, DollarSign } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ])
      .then(([products, orders]) => {
        const isPaid = (o: any) => o.paymentStatus === "SUCCESS" || o.status === "DELIVERED"
        const revenue = Array.isArray(orders)
          ? orders.filter(isPaid).reduce((s: number, o: any) => s + o.total, 0)
          : 0
        setStats({
          totalProducts: Array.isArray(products) ? products.length : 0,
          totalOrders: Array.isArray(orders) ? orders.length : 0,
          totalRevenue: revenue,
          totalCustomers: 0,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { title: "Total Produk", value: stats.totalProducts, icon: ShoppingBag, color: "text-blue-600 bg-blue-100" },
    { title: "Total Pesanan", value: stats.totalOrders, icon: Package, color: "text-purple-600 bg-purple-100" },
    { title: "Pendapatan", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "text-green-600 bg-green-100" },
    { title: "Pelanggan", value: stats.totalCustomers || "-", icon: Users, color: "text-amber-600 bg-amber-100" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "..." : card.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
    </div>
  )
}
