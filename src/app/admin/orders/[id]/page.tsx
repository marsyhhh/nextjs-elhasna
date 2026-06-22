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

  if (loading) return <p className="text-muted-foreground">Memuat...</p>
  if (!order) return <p>Pesanan tidak ditemukan</p>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Detail Pesanan</h1>
        <span className="text-sm text-slate-500">{order.invoiceNumber}</span>
        <Badge variant="outline" className="ml-auto">{statusOptions.find(o => o.value === order.status)?.label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Informasi Pelanggan</h3>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500">Nama</span><span>{order.user?.name || "-"}</span>
                <span className="text-slate-500">Email</span><span>{order.user?.email}</span>
                <span className="text-slate-500">Telepon</span><span>{order.user?.phone || "-"}</span>
              </div>
              {order.address && (
                <>
                  <h3 className="font-semibold">Alamat Pengiriman</h3>
                  <Separator />
                  <p className="text-sm">{order.address.street}, {order.address.city}, {order.address.province} {order.address.postalCode}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Item Pesanan</h3>
              <Separator />
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product?.name} x{item.quantity}</span>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Ongkir</span><span>{formatPrice(order.shippingCost)}</span></div>
                <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{formatPrice(order.total)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Update Status</h3>
              <Separator />
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Status Pesanan</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>No. Resi</Label>
                  <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="JP1234567890" />
                </div>
              </div>
              <Button onClick={handleUpdate} disabled={saving} className="w-full">
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
