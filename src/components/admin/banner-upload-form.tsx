"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/admin/image-upload"
import { toast } from "sonner"

/**
 * CONTOH: Form Upload Banner Promosi
 * 
 * Use case:
 * - Upload gambar banner untuk homepage
 * - Upload gambar hero section
 * - Upload gambar kategori
 */

interface BannerFormProps {
  initialData?: {
    id: string
    title: string
    image: string
  }
  onSuccess?: () => void
}

export function BannerUploadForm({ initialData, onSuccess }: BannerFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(initialData?.image || "")
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    link: "",
    description: "",
  })

  const handleImageUpload = (urls: string[]) => {
    if (urls.length > 0) {
      setImageUrl(urls[0])  // Ambil gambar yang pertama
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageUrl) {
      toast.error("Pilih gambar banner")
      return
    }

    setIsLoading(true)

    try {
      const url = initialData?.id ? `/api/banners/${initialData.id}` : "/api/banners"
      const method = initialData?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          image: imageUrl,  // URL dari Cloudinary
          link: formData.link || null,
          description: formData.description || null,
        }),
      })

      if (!response.ok) throw new Error("Gagal menyimpan banner")

      toast.success(initialData?.id ? "Banner diperbarui" : "Banner dibuat")
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Informasi Banner</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Judul</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Promo Flash Sale 50%"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Deskripsi</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Opsional: Deskripsi singkat banner"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Link (Opsional)</label>
            <Input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({...formData, link: e.target.value})}
              placeholder="https://..."
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Gambar Banner</h2>
        <ImageUpload
          folder="banners"
          maxFiles={1}  // Banner hanya butuh 1 gambar
          onUploadSuccess={handleImageUpload}
        />
      </Card>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full">
        {isLoading ? "Menyimpan..." : initialData?.id ? "Perbarui Banner" : "Buat Banner"}
      </Button>
    </form>
  )
}
