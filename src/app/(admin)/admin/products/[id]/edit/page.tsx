"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/admin/image-upload"
import { toast } from "sonner"
import { Plus, X, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [form, setForm] = useState({
    name: "", description: "", price: "", discountPrice: "", costPrice: "",
    weight: "100", stock: "0", categoryId: "", materials: "", isFlashSale: false,
  })

  const [hasVariants, setHasVariants] = useState(false)
  const [var1Label, setVar1Label] = useState("Warna")
  const [var1Options, setVar1Options] = useState<string[]>([])
  const [var1Input, setVar1Input] = useState("")
  const [var2Label, setVar2Label] = useState("Ukuran")
  const [var2Options, setVar2Options] = useState<string[]>([])
  const [var2Input, setVar2Input] = useState("")
  const [stockMatrix, setStockMatrix] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(data => setCategories(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) throw new Error("Produk tidak ditemukan")
        const product = await res.json()
        setForm({
          name: product.name,
          description: product.description || "",
          price: product.price.toString(),
          discountPrice: product.discountPrice?.toString() || "",
          costPrice: product.costPrice?.toString() || "",
          weight: product.weight.toString(),
          stock: product.stock.toString(),
          categoryId: product.categoryId || "",
          materials: product.materials || "",
          isFlashSale: product.isFlashSale || false,
        })
        setUploadedImages(product.images || [])

        // Load variants & combinations
        if (product.variants?.length) {
          const types = [...new Set(product.variants.map((v: any) => v.type))]
          const opts1 = product.variants.filter((v: any) => v.type === types[0]).map((v: any) => v.name)
          setVar1Label(types[0] as string)
          setVar1Options(opts1)

          if (types.length > 1) {
            const opts2 = product.variants.filter((v: any) => v.type === types[1]).map((v: any) => v.name)
            setVar2Label(types[1] as string)
            setVar2Options(opts2)
          }

          // Build stock matrix from combinations
          const matrix: Record<string, Record<string, string>> = {}
          if (product.combinations?.length) {
            const var1Map: Record<string, string> = {}
            product.variants.forEach((v: any) => { var1Map[v.id] = v.name })

            for (const c of product.combinations) {
              const o1 = var1Map[c.variant1Id]
              const o2 = c.variant2Id ? var1Map[c.variant2Id] : ""
              if (!matrix[o1]) matrix[o1] = {}
              matrix[o1][o2] = c.stock.toString()
            }
          }
          setStockMatrix(matrix)
          setHasVariants(true)
        }
      } catch {
        toast.error("Gagal memuat produk")
        router.push("/admin/products")
      }
      setFetching(false)
    }
    fetchProduct()
  }, [productId, router])

  useEffect(() => {
    if (!hasVariants) return
    const newMatrix: Record<string, Record<string, string>> = {}
    const opts1 = var1Options.length ? var1Options : [""]
    const opts2 = var2Options.length ? var2Options : [""]

    for (const o1 of opts1) {
      if (!o1) continue
      newMatrix[o1] = {}
      for (const o2 of opts2) {
        if (!o2) continue
        newMatrix[o1][o2] = stockMatrix[o1]?.[o2] || "0"
      }
    }
    setStockMatrix(newMatrix)
  }, [var1Options, var2Options, hasVariants])

  function getTotalStock(): number {
    let total = 0
    for (const o1 of Object.keys(stockMatrix)) {
      for (const o2 of Object.keys(stockMatrix[o1])) {
        total += parseInt(stockMatrix[o1][o2]) || 0
      }
    }
    return total
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadedImages.length) { toast.error("Tambahkan minimal 1 gambar produk"); return }
    setLoading(true)
    try {
      const body: any = {
        name: form.name, description: form.description,
        price: parseInt(form.price),
        discountPrice: form.discountPrice ? parseInt(form.discountPrice) : null,
        costPrice: form.costPrice ? parseInt(form.costPrice) : null,
        weight: parseInt(form.weight),
        categoryId: form.categoryId, materials: form.materials || null,
        isFlashSale: form.isFlashSale, images: uploadedImages,
      }

      if (hasVariants) {
        const variants: { name: string; type: string }[] = []
        for (const o of var1Options) variants.push({ name: o, type: var1Label })
        for (const o of var2Options) variants.push({ name: o, type: var2Label })

        const combinations: { variant1Name: string; variant2Name: string | null; stock: number }[] = []
        for (const o1 of Object.keys(stockMatrix)) {
          for (const o2 of Object.keys(stockMatrix[o1])) {
            const s = parseInt(stockMatrix[o1][o2]) || 0
            combinations.push({
              variant1Name: o1,
              variant2Name: var2Options.length ? o2 : null,
              stock: s,
            })
          }
        }

        body.variants = variants
        body.combinations = combinations
      } else {
        body.stock = parseInt(form.stock) || 0
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success("Produk berhasil diperbarui"); router.push("/admin/products"); router.refresh()
    } catch (err: any) { toast.error(err.message || "Gagal memperbarui produk") }
    setLoading(false)
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Produk</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card><CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Informasi Produk</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nama Produk</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Gamis Premium" /></div>
            <div className="space-y-2"><Label>Kategori</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v ?? "" })}>
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
            {!hasVariants ? (
              <div className="space-y-2"><Label>Stok</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            ) : (
              <div className="space-y-2"><Label>Total Stok</Label><Input type="number" value={getTotalStock()} readOnly className="bg-slate-50" /></div>
            )}
            <div className="space-y-2"><Label>Berat (gram)</Label><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required /></div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFlashSale} onChange={(e) => setForm({ ...form, isFlashSale: e.target.checked })} /> Flash Sale</label>
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-900">Varian Produk</h3>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasVariants} onChange={(e) => {
                setHasVariants(e.target.checked)
                if (!e.target.checked) {
                  setVar1Options([])
                  setVar2Options([])
                  setStockMatrix({})
                }
              }} />
              Aktifkan varian
            </label>
          </div>

          {hasVariants && (
            <div className="space-y-6">
              <div className="space-y-3 p-4 border rounded-lg bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-16">Label Varian</Label>
                  <Input value={var1Label} onChange={(e) => setVar1Label(e.target.value)} className="w-40 h-8 text-sm" placeholder="contoh: Warna" />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {var1Options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white border rounded-md px-2 py-1 text-sm">
                      <span>{opt}</span>
                      <button type="button" onClick={() => {
                        setVar1Options(var1Options.filter((_, j) => j !== i))
                      }}><X className="h-3 w-3 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <Input
                      value={var1Input}
                      onChange={(e) => setVar1Input(e.target.value)}
                      className="w-24 h-8 text-sm"
                      placeholder="Nama opsi"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && var1Input.trim()) {
                          e.preventDefault()
                          setVar1Options([...var1Options, var1Input.trim()])
                          setVar1Input("")
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => {
                      if (var1Input.trim()) {
                        setVar1Options([...var1Options, var1Input.trim()])
                        setVar1Input("")
                      }
                    }}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 border rounded-lg bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-16">Label Varian</Label>
                  <Input value={var2Label} onChange={(e) => setVar2Label(e.target.value)} className="w-40 h-8 text-sm" placeholder="contoh: Ukuran" />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {var2Options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white border rounded-md px-2 py-1 text-sm">
                      <span>{opt}</span>
                      <button type="button" onClick={() => {
                        setVar2Options(var2Options.filter((_, j) => j !== i))
                      }}><X className="h-3 w-3 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <Input
                      value={var2Input}
                      onChange={(e) => setVar2Input(e.target.value)}
                      className="w-24 h-8 text-sm"
                      placeholder="Nama opsi"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && var2Input.trim()) {
                          e.preventDefault()
                          setVar2Options([...var2Options, var2Input.trim()])
                          setVar2Input("")
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => {
                      if (var2Input.trim()) {
                        setVar2Options([...var2Options, var2Input.trim()])
                        setVar2Input("")
                      }
                    }}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>

              {var1Options.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Stok per Kombinasi</Label>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border p-2 bg-slate-100 text-left font-medium text-xs text-slate-600 w-20">
                            {var1Label} \\ {var2Options.length ? var2Label : ""}
                          </th>
                          {(var2Options.length ? var2Options : [""]).map((o2, j) => (
                            <th key={j} className="border p-2 bg-slate-100 text-center font-medium text-xs text-slate-600">
                              {o2 || var1Label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {var1Options.map((o1, i) => (
                          <tr key={i}>
                            <td className="border p-2 font-medium text-xs text-slate-600 bg-slate-50">{o1}</td>
                            {(var2Options.length ? var2Options : [""]).map((o2, j) => (
                              <td key={j} className="border p-1">
                                <Input
                                  type="number"
                                  value={stockMatrix[o1]?.[o2] ?? "0"}
                                  onChange={(e) => {
                                    const m = { ...stockMatrix }
                                    if (!m[o1]) m[o1] = {}
                                    m[o1][o2] = e.target.value
                                    setStockMatrix(m)
                                  }}
                                  className="h-8 w-20 text-center text-sm mx-auto"
                                  min="0"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-400">Total Stok: <strong>{getTotalStock()}</strong></p>
                </div>
              )}

              {var1Options.length === 0 && (
                <p className="text-sm text-slate-400">Tambahkan minimal 1 opsi varian untuk mengatur stok</p>
              )}
            </div>
          )}

          {!hasVariants && (
            <p className="text-sm text-slate-400">Centang "Aktifkan varian" jika produk memiliki pilihan warna/ukuran/bahan dll.</p>
          )}
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Gambar Produk</h3>
          <ImageUpload folder="products" maxFiles={5} onUploadSuccess={setUploadedImages} onUploadError={(e) => toast.error(e)} />
          {uploadedImages.length > 0 && (
            <p className="text-xs text-slate-400">{uploadedImages.length} gambar terupload</p>
          )}
        </CardContent></Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </form>
    </div>
  )
}
