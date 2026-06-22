"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react"
import { toast } from "sonner"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch { toast.error("Gagal memuat produk") }
    setLoading(false)
  }

  async function deleteProduct(id: string) {
    if (!confirm("Hapus produk ini?")) return
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" })
      toast.success("Produk berhasil dihapus")
      fetchProducts()
    } catch { toast.error("Gagal menghapus produk") }
  }

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produk</h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} produk terdaftar</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="h-4 w-4" /> Tambah Produk</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Cari produk..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="h-6 w-6" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-slate-900 truncate">{product.name}</p>
                  {product.isFlashSale && <Badge className="text-[10px] bg-red-100 text-red-700">Flash Sale</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {product.category?.name && <Badge variant="secondary" className="text-[10px]">{product.category.name}</Badge>}
                  <span className="text-xs text-slate-500">Stok: {product.stock}</span>
                  <span className="text-xs text-slate-500">{product.weight}g</span>
                </div>
                <p className="text-sm font-semibold mt-1">
                  {product.discountPrice ? (
                    <span className="text-destructive">{formatPrice(product.discountPrice)} <span className="line-through text-slate-400 text-xs">{formatPrice(product.price)}</span></span>
                  ) : (
                    formatPrice(product.price)
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                  <Link href={`/admin/products/${product.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} className="h-8 w-8 text-slate-400 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>Tidak ada produk ditemukan</p>
            <Button variant="outline" className="mt-4" asChild><Link href="/admin/products/new">Tambah Produk</Link></Button>
          </div>
        )}
        {loading && <p className="text-center text-slate-400 py-8">Memuat...</p>}
      </div>
    </div>
  )
}
