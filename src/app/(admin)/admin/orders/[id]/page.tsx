"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { ArrowLeft, Package, Truck } from "lucide-react"

const statusOptions = [
  { value: "PENDING_PAYMENT", label: "Belum Dibayar" },
  { value: "PROCESSING", label: "Diproses" },
  { value: "SHIPPED", label: "Dikirim" },
  { value: "DELIVERED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
]

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchOrder() }, [])

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      const data = await res.json()
      setOrder(data)
      setStatus(data.status)
      setTrackingNumber(data.trackingNumber || "")
    } catch { toast.error("Gagal memuat pesanan") }
    setLoading(false)
  }

  async function handleUpdate() {
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingNumber }),
      })
      if (!res.ok) throw new Error()
      toast.success("Pesanan berhasil diupdate")
      router.refresh()
    } catch { toast.error("Gagal mengupdate pesanan") }
    setSaving(false)
  }

  if (loading) return <p className="text-slate-400 py-8 text-center">Memuat...</p>
  if (!order) return (
    <div className="text-center py-12 text-slate-400">
      <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
      <p>Pesanan tidak ditemukan</p>
      <Button variant="outline" className="mt-4" asChild><Link href="/admin/orders">Kembali</Link></Button>
    </div>
  )

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-2">
        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900">Detail Pesanan</h1>
          <code className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{order.invoiceNumber}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Informasi Pelanggan</h3>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-slate-400">Nama</span><span className="text-slate-700">{order.user?.name || "-"}</span>
              <span className="text-slate-400">Email</span><span className="text-slate-700">{order.user?.email}</span>
              <span className="text-slate-400">Telepon</span><span className="text-slate-700">{order.user?.phone || "-"}</span>
            </div>
            {order.address && (
              <>
                <h3 className="font-semibold text-slate-900 mt-4">Alamat Pengiriman</h3>
                <Separator />
                <p className="text-sm text-slate-600">{order.address.street}, {order.address.city}, {order.address.province} {order.address.postalCode}</p>
              </>
            )}
          </CardContent></Card>

          <Card><CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Item Pesanan</h3>
            <Separator />
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span className="text-slate-700">{item.product?.name} <span className="text-slate-400">x{item.quantity}</span></span>
                <span className="font-medium">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            <Separator />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-slate-400">Diskon</span><span className="text-green-600">-{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-400">Ongkir</span><span>{formatPrice(order.shippingCost)}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </CardContent></Card>
        </div>

        <div className="space-y-6">
          <Card><CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Update Status</h3>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Status Pesanan</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Nomor Resi</Label>
                <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="JP1234567890" />
                <p className="text-[10px] text-slate-400">Masukkan nomor resi ekspedisi (J&T, SiCepat, dll)</p>
              </div>
            </div>
            <Button onClick={handleUpdate} disabled={saving} className="w-full gap-2">
              <Truck className="h-4 w-4" />{saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </CardContent></Card>
        </div>
      </div>
    </div>
  )
}
