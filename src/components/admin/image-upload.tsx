"use client"

import { useState, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { X, Upload, Loader2 } from "lucide-react"

interface ImageUploadProps {
  folder?: "products" | "banners" | "avatars" | "categories"
  maxFiles?: number
  onUploadSuccess: (urls: string[]) => void
  onUploadError?: (error: string) => void
}

interface UploadedImage {
  id: string
  url: string
  publicId: string
  name: string
  size: number
}

export function ImageUpload({
  folder = "products",
  maxFiles = 3,
  onUploadSuccess,
  onUploadError,
}: ImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const uploadFiles = useCallback(
    async (files: FileList) => {
      if (uploadedImages.length + files.length > maxFiles) {
        toast.error(`Maksimal ${maxFiles} gambar yang dapat diunggah`)
        return
      }

      setIsLoading(true)
      const newImages: UploadedImage[] = []
      let hasError = false

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        try {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folder", folder)

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Gagal mengunggah gambar")
          }

          const result = await response.json()

          newImages.push({
            id: Math.random().toString(36).substr(2, 9),
            url: result.data.url,
            publicId: result.data.publicId,
            name: file.name,
            size: file.size,
          })

          toast.success(`${file.name} berhasil diunggah`)
        } catch (error) {
          hasError = true
          const errorMessage = error instanceof Error ? error.message : "Gagal mengunggah gambar"
          toast.error(errorMessage)
          onUploadError?.(errorMessage)
        }
      }

      const updatedImages = [...uploadedImages, ...newImages]
      setUploadedImages(updatedImages)

      if (newImages.length > 0) {
        onUploadSuccess(updatedImages.map((img) => img.url))
      }

      setIsLoading(false)
    },
    [uploadedImages, maxFiles, folder, onUploadSuccess, onUploadError]
  )

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files)
    }
  }

  const removeImage = async (imageId: string) => {
    const image = uploadedImages.find((img) => img.id === imageId)
    if (!image) return

    try {
      const response = await fetch(`/api/upload?publicId=${image.publicId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Gagal menghapus gambar")
      }

      const updated = uploadedImages.filter((img) => img.id !== imageId)
      setUploadedImages(updated)
      onUploadSuccess(updated.map((img) => img.url))
      toast.success("Gambar berhasil dihapus")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus gambar")
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          disabled={isLoading}
          className="hidden"
          aria-label="Upload images"
        />

        <div className="space-y-2">
          <div className="flex justify-center">
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isLoading ? "Sedang mengunggah..." : "Seret gambar ke sini atau klik untuk memilih"}
            </p>
            <p className="text-xs text-gray-500">
              Maksimal {maxFiles - uploadedImages.length} gambar lagi | Ukuran max 5MB
            </p>
          </div>
          <Button
            type="button"
            onClick={handleButtonClick}
            disabled={isLoading}
            variant="outline"
            className="mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengunggah...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Pilih Gambar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Gambar Terunggah ({uploadedImages.length}/{maxFiles})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {uploadedImages.map((image) => (
              <Card key={image.id} className="relative group overflow-hidden">
                <div className="relative w-full aspect-square bg-gray-100">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>

                {/* Delete Button on Hover */}
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label="Delete image"
                >
                  <X className="w-6 h-6 text-white" />
                </button>

                {/* Image Name Tooltip */}
                <div className="p-2 bg-gray-50 text-xs truncate" title={image.name}>
                  {image.name}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
