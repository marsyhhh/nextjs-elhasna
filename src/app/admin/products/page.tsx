"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      setProducts(data)
    } catch {
      toast.error("Gagal memuat produk")
    }
    setLoading(false)
  }

  async function deleteProduct(id: string) {
    if (!confirm("Hapus produk ini?")) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Produk berhasil dihapus")
      fetchProducts()
    } catch {
      toast.error("Gagal menghapus produk")
    }
  }

  if (loading) return <p className="text-muted-foreground">Memuat...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Produk</h1>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="h-4 w-4" /> Tambah Produk</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{product.category?.name}</Badge>
                  <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
                </div>
                <p className="text-sm font-semibold mt-1">{formatPrice(product.discountPrice || product.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/products/${product.id}`}><Pencil className="h-4 w-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
