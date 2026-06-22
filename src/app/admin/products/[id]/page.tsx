"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "", description: "", price: "", discountPrice: "", costPrice: "",
    weight: "100", stock: "0", categoryId: "", materials: "", isFlashSale: false,
  })

  useEffect(() => {
    fetch(`/api/categories`).then(r => r.json()).then(setCategories)
    fetch(`/api/products/${params.id}`).then(r => r.json()).then((product) => {
      setForm({
        name: product.name, description: product.description, price: String(product.price),
        discountPrice: product.discountPrice ? String(product.discountPrice) : "",
        costPrice: product.costPrice ? String(product.costPrice) : "",
        weight: String(product.weight), stock: String(product.stock),
        categoryId: product.categoryId, materials: product.materials || "",
        isFlashSale: product.isFlashSale,
      })
    }).catch(() => toast.error("Gagal memuat produk"))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, description: form.description, price: parseInt(form.price),
          discountPrice: form.discountPrice ? parseInt(form.discountPrice) : null,
          costPrice: form.costPrice ? parseInt(form.costPrice) : null,
          weight: parseInt(form.weight), stock: parseInt(form.stock),
          categoryId: form.categoryId, materials: form.materials || null,
          isFlashSale: form.isFlashSale,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Produk berhasil diupdate")
      router.push("/admin/products")
    } catch { toast.error("Gagal mengupdate produk") }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Edit Produk</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card><CardContent className="p-6 space-y-4">
          <h3 className="font-semibold">Informasi Produk</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nama Produk</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Kategori</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
          <div className="space-y-2"><Label>Bahan</Label><Input value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} /></div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <h3 className="font-semibold">Harga & Stok</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Harga</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Harga Diskon</Label><Input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} /></div>
            <div className="space-y-2"><Label>Harga Modal</Label><Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Stok</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div className="space-y-2"><Label>Berat (gram)</Label><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required /></div>
            <div className="space-y-2 flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isFlashSale} onChange={(e) => setForm({ ...form, isFlashSale: e.target.checked })} />
                Flash Sale
              </label>
            </div>
          </div>
        </CardContent></Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </form>
    </div>
  )
}
