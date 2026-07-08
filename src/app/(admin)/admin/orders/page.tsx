"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/utils"
import { Search, Package, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 10

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
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
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch { console.error("Failed to fetch orders") }
    setLoading(false)
  }

  const filteredByDate = filterType === "all" ? orders : orders.filter((o) => {
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

  const filtered = filteredByDate.filter(
    (o) =>
      o.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesanan</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} pesanan ditemukan</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Date Filter */}
      <Card>
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
                  <Label className="text-xs text-slate-400">Dari</Label>
                  <Input type="date" className="w-auto" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-400">Sampai</Label>
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Cari pesanan..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {paginated.map((order) => (
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
        {paginated.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>Tidak ada pesanan</p>
          </div>
        )}
        {loading && <p className="text-center text-slate-400 py-8">Memuat...</p>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
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
