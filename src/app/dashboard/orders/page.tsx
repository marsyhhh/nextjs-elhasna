"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/utils"
import { Package, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 10

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Belum Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  DELIVERED: "Selesai",
  CANCELLED: "Dibatalkan",
}

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

function pad(n: number): string {
  return n.toString().padStart(2, "0")
}

function getTodayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getDefaultWeek(): string {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const dayOffset = (jan4.getDay() + 6) % 7
  const ms = now.getTime() - jan4.getTime() + dayOffset * 86400000
  const week = Math.ceil(ms / (7 * 86400000))
  return `${now.getFullYear()}-W${pad(week)}`
}

function getDefaultMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
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

function getMonthDateRange(val: string): { start: Date; end: Date } | null {
  const m = val.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const year = Number(m[1]), month = Number(m[2]) - 1
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<"all" | "date" | "week" | "month">("all")
  const [startDate, setStartDate] = useState(getTodayISO())
  const [endDate, setEndDate] = useState(getTodayISO())
  const [selectedWeek, setSelectedWeek] = useState(getDefaultWeek())
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth())
  const [page, setPage] = useState(1)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders")
      setOrders(await res.json())
    } catch { console.error("Failed to fetch orders") }
    setLoading(false)
  }

  const filtered = filterType === "all" ? orders : orders.filter((o) => {
    const d = new Date(o.createdAt)
    if (filterType === "date") {
      const from = new Date(startDate)
      from.setHours(0, 0, 0, 0)
      const to = new Date(endDate)
      to.setHours(23, 59, 59, 999)
      return d >= from && d <= to
    }
    if (filterType === "week") {
      const range = getWeekDateRange(selectedWeek)
      return range ? d >= range.start && d <= range.end : true
    }
    if (filterType === "month") {
      const range = getMonthDateRange(selectedMonth)
      return range ? d >= range.start && d <= range.end : true
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  if (loading) return <p className="text-muted-foreground">Memuat...</p>

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Pesanan Saya</h1>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-1.5 text-sm font-normal cursor-pointer">
              <input type="radio" name="filterType" checked={filterType === "all"} onChange={() => { setFilterType("all"); setPage(1) }} />
              Semua
            </Label>
            <Label className="flex items-center gap-1.5 text-sm font-normal cursor-pointer">
              <input type="radio" name="filterType" checked={filterType === "date"} onChange={() => { setFilterType("date"); setPage(1) }} />
              Tanggal
            </Label>
            <Label className="flex items-center gap-1.5 text-sm font-normal cursor-pointer">
              <input type="radio" name="filterType" checked={filterType === "week"} onChange={() => { setFilterType("week"); setPage(1) }} />
              Minggu
            </Label>
            <Label className="flex items-center gap-1.5 text-sm font-normal cursor-pointer">
              <input type="radio" name="filterType" checked={filterType === "month"} onChange={() => { setFilterType("month"); setPage(1) }} />
              Bulan
            </Label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {filterType === "date" && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Dari</Label>
                  <Input type="date" className="w-auto" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Sampai</Label>
                  <Input type="date" className="w-auto" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
                </div>
              </>
            )}
            {filterType === "week" && (
              <Input type="week" className="w-auto" value={selectedWeek} onChange={(e) => { setSelectedWeek(e.target.value); setPage(1) }} />
            )}
            {filterType === "month" && (
              <Input type="month" className="w-auto" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setPage(1) }} />
            )}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Belum ada pesanan</p>
            <Link href="/products" className="text-sm text-primary hover:underline mt-2">Mulai Belanja</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginated.map((order) => (
            <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{order.invoiceNumber}</span>
                    <Badge className={statusColors[order.status]}>{statusLabels[order.status] || order.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                      <p className="text-xs text-muted-foreground">{order.items?.length || 0} item</p>
                    </div>
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-6">
          <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span>Halaman {safePage} dari {totalPages}</span>
          <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
