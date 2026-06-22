"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { Plus, Percent, Pencil, Trash2 } from "lucide-react"

const emptyForm = {
  code: "", description: "", discountPercent: "", discountAmount: "",
  minPurchase: "0", maxDiscount: "", quota: "", isShippingFree: false,
  startDate: "", endDate: "",
}

function toLocalDateTimeString(date: string | Date) {
  if (!date) return ""
  const d = new Date(date)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildPayload(form: typeof emptyForm) {
  return {
    code: form.code,
    description: form.description || null,
    discountPercent: form.discountPercent ? parseInt(form.discountPercent) : null,
    discountAmount: form.discountAmount ? parseInt(form.discountAmount) : null,
    minPurchase: parseInt(form.minPurchase || "0"),
    maxDiscount: form.maxDiscount ? parseInt(form.maxDiscount) : null,
    quota: form.quota ? parseInt(form.quota) : null,
    isShippingFree: form.isShippingFree,
    startDate: form.startDate,
    endDate: form.endDate,
  }
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchVouchers() }, [])

  async function fetchVouchers() {
    try {
      const res = await fetch("/api/vouchers")
      const data = await res.json()
      setVouchers(Array.isArray(data) ? data : [])
    } catch { toast.error("Gagal memuat voucher") }
    setLoading(false)
  }

  function handleOpenCreate() {
    setEditingVoucher(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function handleOpenEdit(v: any) {
    setEditingVoucher(v)
    setForm({
      code: v.code,
      description: v.description || "",
      discountPercent: v.discountPercent?.toString() || "",
      discountAmount: v.discountAmount?.toString() || "",
      minPurchase: v.minPurchase?.toString() || "0",
      maxDiscount: v.maxDiscount?.toString() || "",
      quota: v.quota?.toString() || "",
      isShippingFree: v.isShippingFree || false,
      startDate: toLocalDateTimeString(v.startDate),
      endDate: toLocalDateTimeString(v.endDate),
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingVoucher) {
        const res = await fetch(`/api/vouchers/${editingVoucher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(form)),
        })
        if (!res.ok) throw new Error()
        toast.success("Voucher berhasil diperbarui")
      } else {
        const res = await fetch("/api/vouchers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(form)),
        })
        if (!res.ok) throw new Error()
        toast.success("Voucher berhasil dibuat")
      }
      setOpen(false)
      setEditingVoucher(null)
      setForm(emptyForm)
      fetchVouchers()
    } catch { toast.error(editingVoucher ? "Gagal memperbarui voucher" : "Gagal membuat voucher") }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/vouchers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Voucher berhasil dihapus")
      fetchVouchers()
    } catch { toast.error("Gagal menghapus voucher") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voucher & Diskon</h1>
          <p className="text-sm text-slate-500 mt-0.5">{vouchers.length} voucher</p>
        </div>
        <Button onClick={handleOpenCreate}><Plus className="h-4 w-4" /> Tambah Voucher</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingVoucher ? "Edit Voucher" : "Buat Voucher Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Kode</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="RAMADHAN50" /></div>
              <div className="space-y-2"><Label>Diskon (%)</Label><Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Deskripsi</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Min. Belanja</Label><Input type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} /></div>
              <div className="space-y-2"><Label>Max Diskon</Label><Input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></div>
              <div className="space-y-2"><Label>Kuota</Label><Input type="number" value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mulai</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Berakhir</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isShippingFree} onChange={(e) => setForm({ ...form, isShippingFree: e.target.checked })} /> Gratis Ongkir</label>
            <Button type="submit" className="w-full">{editingVoucher ? "Perbarui Voucher" : "Buat Voucher"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? <p className="text-slate-400">Memuat...</p> : (
        <div className="space-y-3">
          {vouchers.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{v.code}</span>
                    {v.isActive ? <Badge variant="secondary" className="text-[10px]">Aktif</Badge> : <Badge variant="outline" className="text-[10px]">Nonaktif</Badge>}
                  </div>
                  {v.description && <p className="text-xs text-slate-400 mt-1">{v.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {v.discountPercent ? `${v.discountPercent}%` : v.discountAmount ? formatPrice(v.discountAmount) : ""}
                    {v.isShippingFree ? " + Gratis Ongkir" : ""}
                    {" | Min: " + formatPrice(v.minPurchase)}
                    {" | Digunakan: " + v.usedCount + (v.quota ? "/" + v.quota : "")}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(v)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90">
                      <Trash2 className="h-3.5 w-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Voucher</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus voucher &quot;{v.code}&quot;? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(v.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {vouchers.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Percent className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Belum ada voucher</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
