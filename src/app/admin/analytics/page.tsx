"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatPrice } from "@/lib/utils"

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, totalOrders: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch("/api/orders")
      const orders = await res.json()

      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const today = orders
        .filter((o: any) => o.paymentStatus === "SUCCESS" && new Date(o.paidAt) >= startOfDay)
        .reduce((sum: number, o: any) => sum + o.total, 0)

      const week = orders
        .filter((o: any) => o.paymentStatus === "SUCCESS" && new Date(o.paidAt) >= startOfWeek)
        .reduce((sum: number, o: any) => sum + o.total, 0)

      const month = orders
        .filter((o: any) => o.paymentStatus === "SUCCESS" && new Date(o.paidAt) >= startOfMonth)
        .reduce((sum: number, o: any) => sum + o.total, 0)

      setStats({ today, week, month, totalOrders: orders.length })
    } catch {
      console.error("Failed to fetch stats")
    }
    setLoading(false)
  }

  if (loading) return <p className="text-muted-foreground">Memuat...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Analitik Penjualan</h1>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="weekly">Mingguan</TabsTrigger>
          <TabsTrigger value="monthly">Bulanan</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Omzet Hari Ini</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatPrice(stats.today)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Pesanan Hari Ini</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{stats.totalOrders}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Omzet Minggu Ini</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatPrice(stats.week)}</p></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Omzet Minggu Ini</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatPrice(stats.week)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Pesanan</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{stats.totalOrders}</p></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Omzet Bulan Ini</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatPrice(stats.month)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Pesanan</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{stats.totalOrders}</p></CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>Grafik Penjualan</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
            Grafik akan ditampilkan di sini (integrasikan dengan library chart seperti recharts)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
