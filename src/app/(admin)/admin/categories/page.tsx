"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Plus, Layers, Pencil, Trash2 } from "lucide-react"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [form, setForm] = useState({ name: "", description: "" })

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch { toast.error("Gagal memuat kategori") }
    setLoading(false)
  }

  function handleOpenCreate() {
    setEditingCategory(null)
    setForm({ name: "", description: "" })
    setOpen(true)
  }

  function handleOpenEdit(cat: any) {
    setEditingCategory(cat)
    setForm({ name: cat.name, description: cat.description || "" })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success("Kategori berhasil diperbarui")
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success("Kategori berhasil dibuat")
      }
      setOpen(false)
      setEditingCategory(null)
      setForm({ name: "", description: "" })
      fetchCategories()
    } catch { toast.error(editingCategory ? "Gagal memperbarui kategori" : "Gagal membuat kategori") }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menghapus kategori")
      toast.success("Kategori berhasil dihapus")
      fetchCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kategori")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori</h1>
          <p className="text-sm text-slate-500 mt-0.5">{categories.length} kategori</p>
        </div>
        <Button onClick={handleOpenCreate}><Plus className="h-4 w-4" /> Tambah Kategori</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Kategori</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Gamis" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Koleksi gamis modern" />
            </div>
            <Button type="submit" className="w-full">{editingCategory ? "Perbarui" : "Simpan"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? <p className="text-slate-400">Memuat...</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10"><Layers className="h-4 w-4 text-primary" /></div>
                  <p className="font-medium text-slate-900">{cat.name}</p>
                </div>
                {cat.description && <p className="text-xs text-slate-400">{cat.description}</p>}
                <p className="text-xs text-slate-400 mt-2">{cat._count?.products || 0} produk</p>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(cat)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90">
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus kategori &quot;{cat.name}&quot;? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {categories.length === 0 && <p className="text-slate-400 col-span-full text-center py-8">Belum ada kategori</p>}
        </div>
      )}
    </div>
  )
}
