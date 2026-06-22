"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/admin/image-upload"
import { toast } from "sonner"
import { Plus, X, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [form, setForm] = useState({
    name: "", description: "", price: "", discountPrice: "", costPrice: "",
    weight: "100", stock: "0", categoryId: "", materials: "", isFlashSale: false,
  })
  const [variants, setVariants] = useState<{ name: string; type: string; stock: string }[]>([])

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(data => setCategories(Array.isArray(data) ? data : []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadedImages.length) { toast.error("Tambahkan minimal 1 gambar produk"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, description: form.description,
          price: parseInt(form.price),
          discountPrice: form.discountPrice ? parseInt(form.discountPrice) : null,
          costPrice: form.costPrice ? parseInt(form.costPrice) : null,
          weight: parseInt(form.weight), stock: parseInt(form.stock),
          categoryId: form.categoryId, materials: form.materials || null,
          isFlashSale: form.isFlashSale, images: uploadedImages,
          variants: variants.map(v => ({ ...v, stock: parseInt(v.stock) })),
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success("Produk berhasil dibuat"); router.push("/admin/products"); router.refresh()
    } catch (err: any) { toast.error(err.message || "Gagal membuat produk") }
    setLoading(false)
  }

  function addVariant() { setVariants([...variants, { name: "", type: "color", stock: "0" }]) }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-900">Tambah Produk Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card><CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Informasi Produk</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nama Produk</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Gamis Premium" /></div>
            <div className="space-y-2"><Label>Kategori</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
          <div className="space-y-2"><Label>Bahan</Label><Input value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} placeholder="Katun Voal, Silk" /></div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Harga & Stok</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Harga (Rp)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Harga Diskon</Label><Input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} /></div>
            <div className="space-y-2"><Label>Harga Modal</Label><Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Stok</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div className="space-y-2"><Label>Berat (gram)</Label><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required /></div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFlashSale} onChange={(e) => setForm({ ...form, isFlashSale: e.target.checked })} /> Flash Sale</label>
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Varian (Warna/Ukuran)</h3>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus className="h-3 w-3" /> Tambah</Button>
          </div>
          {variants.map((v, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="space-y-1 flex-1"><Label className="text-xs">Nama</Label>
                <Input value={v.name} onChange={(e) => { const n = [...variants]; n[i].name = e.target.value; setVariants(n) }} placeholder="Merah" /></div>
              <div className="space-y-1 w-24"><Label className="text-xs">Tipe</Label>
                <Select value={v.type} onValueChange={(val) => { const n = [...variants]; n[i].type = val; setVariants(n) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="color">Warna</SelectItem><SelectItem value="size">Ukuran</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1 w-20"><Label className="text-xs">Stok</Label>
                <Input type="number" value={v.stock} onChange={(e) => { const n = [...variants]; n[i].stock = e.target.value; setVariants(n) }} /></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setVariants(variants.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          {variants.length === 0 && <p className="text-sm text-slate-400">Belum ada varian. Varian opsional untuk warna/ukuran.</p>}
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Gambar Produk</h3>
          <ImageUpload folder="products" maxFiles={5} onUploadSuccess={setUploadedImages} onUploadError={(e) => toast.error(e)} />
        </CardContent></Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Produk"}
        </Button>
      </form>
    </div>
  )
}
