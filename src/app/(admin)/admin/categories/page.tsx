"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Layers } from "lucide-react"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Kategori berhasil dibuat")
      setOpen(false); setForm({ name: "", description: "" }); fetchCategories()
    } catch { toast.error("Gagal membuat kategori") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori</h1>
          <p className="text-sm text-slate-500 mt-0.5">{categories.length} kategori</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Tambah Kategori</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Kategori</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Nama Kategori</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Gamis" /></div>
              <div className="space-y-2"><Label>Deskripsi</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Koleksi gamis modern" /></div>
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
              </CardContent>
            </Card>
          ))}
          {categories.length === 0 && <p className="text-slate-400 col-span-full text-center py-8">Belum ada kategori</p>}
        </div>
      )}
    </div>
  )
}
