"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ code: "", description: "", discountPercent: "", discountAmount: "", minPurchase: "0", maxDiscount: "", quota: "", isShippingFree: false, startDate: "", endDate: "" })

  useEffect(() => {
    fetchVouchers()
  }, [])

  async function fetchVouchers() {
    try {
      const res = await fetch("/api/vouchers")
      const data = await res.json()
      setVouchers(data)
    } catch {
      toast.error("Gagal memuat voucher")
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discountPercent: form.discountPercent ? parseInt(form.discountPercent) : null,
          discountAmount: form.discountAmount ? parseInt(form.discountAmount) : null,
          minPurchase: parseInt(form.minPurchase || "0"),
          maxDiscount: form.maxDiscount ? parseInt(form.maxDiscount) : null,
          quota: form.quota ? parseInt(form.quota) : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Voucher berhasil dibuat")
      setOpen(false)
      setForm({ code: "", description: "", discountPercent: "", discountAmount: "", minPurchase: "0", maxDiscount: "", quota: "", isShippingFree: false, startDate: "", endDate: "" })
      fetchVouchers()
    } catch {
      toast.error("Gagal membuat voucher")
    }
  }

  if (loading) return <p className="text-muted-foreground">Memuat...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Voucher</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg h-8 gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">
            <Plus className="h-4 w-4" /> Tambah Voucher
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Buat Voucher Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kode Voucher</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="RAMADHAN50" />
                </div>
                <div className="space-y-2">
                  <Label>Diskon (%)</Label>
                  <Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min. Belanja</Label>
                  <Input type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Diskon</Label>
                  <Input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Kuota</Label>
                  <Input type="number" value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mulai</Label>
                  <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Berakhir</Label>
                  <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="shipping" checked={form.isShippingFree} onChange={(e) => setForm({ ...form, isShippingFree: e.target.checked })} />
                <Label htmlFor="shipping">Gratis Ongkir</Label>
              </div>
              <Button type="submit" className="w-full">Buat Voucher</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {vouchers.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">{v.code}</span>
                  {v.isActive ? <Badge variant="secondary" className="text-xs">Aktif</Badge> : <Badge variant="outline" className="text-xs">Nonaktif</Badge>}
                </div>
                {v.description && <p className="text-xs text-muted-foreground mt-1">{v.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {v.discountPercent ? `${v.discountPercent}%` : v.discountAmount ? formatPrice(v.discountAmount) : ""}
                  {v.isShippingFree ? " - Gratis Ongkir" : ""}
                  {" | Min: " + formatPrice(v.minPurchase)}
                  {" | Digunakan: " + v.usedCount + (v.quota ? "/" + v.quota : "")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
