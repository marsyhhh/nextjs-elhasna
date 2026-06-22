"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ImageUpload } from "@/components/admin/image-upload"
import { toast } from "sonner"
import { Plus, ImageIcon, Pencil, Trash2 } from "lucide-react"

export default function AdminPromoBannersPage() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<any | null>(null)
  const [form, setForm] = useState({
    title: "", subtitle: "", link: "", order: "0",
  })
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => { fetchBanners() }, [])

  async function fetchBanners() {
    try {
      const res = await fetch("/api/banners?type=PROMO")
      const data = await res.json()
      setBanners(Array.isArray(data) ? data : [])
    } catch { toast.error("Gagal memuat banner promo") }
    setLoading(false)
  }

  function handleOpenCreate() {
    setEditingBanner(null)
    setForm({ title: "", subtitle: "", link: "", order: "0" })
    setImageUrl("")
    setOpen(true)
  }

  function handleOpenEdit(b: any) {
    setEditingBanner(b)
    setForm({
      title: b.title,
      subtitle: b.subtitle || "",
      link: b.link || "",
      order: b.order.toString(),
    })
    setImageUrl(b.image)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!imageUrl) {
      toast.error("Pilih gambar banner")
      return
    }

    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle || null,
        image: imageUrl,
        link: form.link || null,
        order: parseInt(form.order || "0"),
        type: "PROMO",
      }

      if (editingBanner) {
        const res = await fetch(`/api/banners/${editingBanner.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        toast.success("Banner promo berhasil diperbarui")
      } else {
        const res = await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        toast.success("Banner promo berhasil dibuat")
      }
      setOpen(false)
      setEditingBanner(null)
      setForm({ title: "", subtitle: "", link: "", order: "0" })
      setImageUrl("")
      fetchBanners()
    } catch { toast.error(editingBanner ? "Gagal memperbarui banner promo" : "Gagal membuat banner promo") }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Banner promo berhasil dihapus")
      fetchBanners()
    } catch { toast.error("Gagal menghapus banner promo") }
  }

  async function handleToggleActive(b: any) {
    try {
      const res = await fetch(`/api/banners/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !b.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(b.isActive ? "Banner promo dinonaktifkan" : "Banner promo diaktifkan")
      fetchBanners()
    } catch { toast.error("Gagal mengubah status banner promo") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Banner Promo</h1>
          <p className="text-sm text-slate-500 mt-0.5">{banners.length} banner</p>
        </div>
        <Button onClick={handleOpenCreate}><Plus className="h-4 w-4" /> Tambah Banner Promo</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner Promo" : "Tambah Banner Promo Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Promo Spesial Ramadhan" />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Diskon hingga 50%" />
            </div>
            <div className="space-y-2">
              <Label>Link (Opsional)</Label>
              <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/category/gamis" />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gambar Banner</Label>
              <ImageUpload
                folder="banners"
                maxFiles={1}
                onUploadSuccess={(urls) => {
                  if (urls.length > 0) setImageUrl(urls[0])
                }}
              />
              {imageUrl && (
                <div className="relative w-full h-32 rounded-md overflow-hidden border mt-2">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="400px" />
                </div>
              )}
            </div>
            <Button type="submit" className="w-full">
              {editingBanner ? "Perbarui Banner Promo" : "Simpan Banner Promo"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? <p className="text-slate-400">Memuat...</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-0">
                <div className="relative w-full h-40 bg-muted rounded-t-lg overflow-hidden">
                  {b.image ? (
                    <Image src={b.image} alt={b.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-slate-900 truncate">{b.title}</p>
                    {b.isActive ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Aktif</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Nonaktif</span>
                    )}
                  </div>
                  {b.subtitle && <p className="text-xs text-slate-400 truncate">{b.subtitle}</p>}
                  <p className="text-xs text-slate-400 mt-1">Urutan: {b.order}</p>
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(b)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(b)}>
                      {b.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90">
                        <Trash2 className="h-3.5 w-3.5" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Banner Promo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus banner promo &quot;{b.title}&quot;? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(b.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {banners.length === 0 && (
            <div className="text-center py-12 text-slate-400 col-span-full">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Belum ada banner promo</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
