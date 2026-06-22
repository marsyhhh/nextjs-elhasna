"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/admin/image-upload"
import { toast } from "sonner"

/**
 * CONTOH: Form Upload Kategori
 * 
 * Use case:
 * - Upload gambar untuk kategori produk
 * - Setiap kategori memiliki satu gambar
 */

interface CategoryUploadFormProps {
  initialData?: {
    id: string
    name: string
    image: string | null
  }
  onSuccess?: () => void
}

export function CategoryUploadForm({ initialData, onSuccess }: CategoryUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(initialData?.image || "")
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: "",
  })

  const handleImageUpload = (urls: string[]) => {
    if (urls.length > 0) {
      setImageUrl(urls[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Nama kategori tidak boleh kosong")
      return
    }

    setIsLoading(true)

    try {
      const url = initialData?.id ? `/api/categories/${initialData.id}` : "/api/categories"
      const method = initialData?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          image: imageUrl || null,  // URL dari Cloudinary atau null
          description: formData.description || null,
        }),
      })

      if (!response.ok) throw new Error("Gagal menyimpan kategori")

      toast.success(initialData?.id ? "Kategori diperbarui" : "Kategori dibuat")
      
      // Reset form
      setFormData({ name: "", description: "" })
      setImageUrl("")
      
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Informasi Kategori</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Kategori</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Contoh: Hijab Katun"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Deskripsi (Opsional)</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Deskripsi singkat kategori"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Gambar Kategori</h2>
        <p className="text-sm text-gray-600 mb-4">
          Gambar akan ditampilkan di halaman kategori dan category bar
        </p>
        <ImageUpload
          folder="categories"
          maxFiles={1}
          onUploadSuccess={handleImageUpload}
          onUploadError={(error) => toast.error(error)}
        />
      </Card>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full">
        {isLoading ? "Menyimpan..." : initialData?.id ? "Perbarui Kategori" : "Buat Kategori"}
      </Button>
    </form>
  )
}
