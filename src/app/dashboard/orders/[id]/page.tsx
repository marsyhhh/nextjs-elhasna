"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Package, Truck, XCircle } from "lucide-react"

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Belum Dibayar", PROCESSING: "Diproses", SHIPPED: "Dikirim", DELIVERED: "Selesai", CANCELLED: "Dibatalkan",
}

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800", PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800", DELIVERED: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800",
}

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => { fetchOrder() }, [])

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      setOrder(await res.json())
    } catch { console.error("Failed to fetch order") }
    setLoading(false)
  }

  const canCancel = order && (order.status === "PENDING_PAYMENT" || order.status === "PROCESSING")

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: "PATCH" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Gagal membatalkan pesanan")
      }
      toast.success("Pesanan berhasil dibatalkan")
      setCancelOpen(false)
      fetchOrder()
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan pesanan")
    }
    setCancelling(false)
  }

  if (loading) return <p className="text-muted-foreground">Memuat...</p>
  if (!order) return <p className="text-center py-12 text-muted-foreground">Pesanan tidak ditemukan</p>

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/orders"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-heading font-bold">Detail Pesanan</h1>
          <p className="text-sm text-muted-foreground">{order.invoiceNumber}</p>
        </div>
        <Badge className={statusColors[order.status]}>{statusLabels[order.status] || order.status}</Badge>
      </div>

      {canCancel && (
        <div className="flex justify-end">
          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogTrigger render={<Button variant="destructive">Batalkan Pesanan</Button>} />
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <XCircle className="h-6 w-6 text-destructive" />
                </AlertDialogMedia>
                <AlertDialogTitle>Batalkan Pesanan</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Tidak</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? "Membatalkan..." : "Ya, Batalkan"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Item Pesanan</h3>
          <Separator />
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden">
                {item.product?.images?.[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.product?.name}</p>
                {item.variant && <p className="text-xs text-muted-foreground">{item.variant.name}</p>}
                <p className="text-xs text-muted-foreground">{item.quantity} x {formatPrice(item.price)}</p>
              </div>
              <p className="font-semibold text-sm">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {order.courier && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Pengiriman</h3>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Kurir</span><span>{order.courier}</span>
              <span className="text-muted-foreground">Layanan</span><span>{order.courierService}</span>
              {order.trackingNumber && <><span className="text-muted-foreground">No. Resi</span><span className="font-medium">{order.trackingNumber}</span></>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="font-semibold">Ringkasan Pembayaran</h3>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ongkos Kirim</span><span>{formatPrice(order.shippingCost)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatPrice(order.discount)}</span></div>}
            <Separator />
            <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
