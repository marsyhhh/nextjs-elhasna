"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/admin/image-upload"
import { toast } from "sonner"
import { prisma } from "@/lib/prisma"

interface ProductFormWithUploadProps {
  categoryId: string
  categories: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export function ProductFormWithUpload({
  categoryId,
  categories,
  onSuccess,
}: ProductFormWithUploadProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    costPrice: "",
    weight: "",
    stock: "",
    materials: "",
    categoryId: categoryId || "",
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId: value,
    }))
  }

  const handleImagesUpload = (urls: string[]) => {
    setUploadedImages(urls)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!uploadedImages.length) {
      toast.error("Tambahkan minimal 1 gambar produk")
      return
    }

    if (!formData.categoryId) {
      toast.error("Pilih kategori")
      return
    }

    setIsLoading(true)

    try {
      // CONTOH 1: Menggunakan fetch API ke route handler yang akan memanggil Prisma
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseInt(formData.price),
          costPrice: formData.costPrice ? parseInt(formData.costPrice) : null,
          weight: parseInt(formData.weight),
          stock: parseInt(formData.stock),
          materials: formData.materials || null,
          images: uploadedImages,
          categoryId: formData.categoryId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Gagal menyimpan produk")
      }

      toast.success("Produk berhasil ditambahkan")
      setFormData({
        name: "",
        description: "",
        price: "",
        costPrice: "",
        weight: "",
        stock: "",
        materials: "",
        categoryId: categoryId,
      })
      setUploadedImages([])
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan produk")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Informasi Produk</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nama Produk</label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Contoh: Hijab Katun Premium"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Deskripsi</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Jelaskan detail produk..."
              rows={4}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Kategori</label>
            <Select value={formData.categoryId} onValueChange={(v) => v && handleCategoryChange(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Harga (IDR)</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="50000"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Harga Cost (IDR)</label>
              <Input
                type="number"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleInputChange}
                placeholder="30000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Berat (gram)</label>
              <Input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="500"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Stok</label>
              <Input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="100"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Material</label>
            <Input
              type="text"
              name="materials"
              value={formData.materials}
              onChange={handleInputChange}
              placeholder="Contoh: Katun 100%, Polyester"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Gambar Produk</h2>
        <ImageUpload folder="products" maxFiles={5} onUploadSuccess={handleImagesUpload} />
      </Card>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full">
        {isLoading ? "Menyimpan..." : "Tambah Produk"}
      </Button>
    </form>
  )
}
