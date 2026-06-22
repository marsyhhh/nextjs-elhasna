"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, Heart, ShoppingBag, Minus, Plus, Truck } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface ProductDetailProps {
  product: any
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter()
  const { addItem } = useCartStore()
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const mainImage = product.images?.[selectedImageIndex] || product.images?.[0] || ""
  const images = product.images || []

  const hasDiscount = product.discountPrice && product.discountPrice < product.price
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0

  const colorVariants = product.variants?.filter((v: any) => v.type === "color") || []
  const sizeVariants = product.variants?.filter((v: any) => v.type === "size") || []

  function handleAddToCart() {
    addItem({
      id: `${product.id}-${selectedVariant || ""}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.images?.[0] || "",
      variantId: selectedVariant || undefined,
      variantName: selectedVariant ? product.variants?.find((v: any) => v.id === selectedVariant)?.name : undefined,
      quantity,
      weight: product.weight,
      stock: product.stock,
    })
    toast.success("Produk ditambahkan ke keranjang!")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Section */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 bg-muted">
                Gambar tidak tersedia
              </div>
            )}
            {product.isFlashSale && (
              <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">Flash Sale</Badge>
            )}
          </div>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index ? "border-primary" : "border-transparent hover:border-muted-foreground"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{product.category?.name}</p>
            <h1 className="text-2xl md:text-3xl font-heading font-bold">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">4.8</span>
              </div>
              <span className="text-sm text-muted-foreground">(120 terjual)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-bold">{formatPrice(product.discountPrice)}</span>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
                <Badge variant="destructive">-{discountPercent}%</Badge>
              </>
            ) : (
              <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            )}
          </div>

          <Separator />

          {product.materials && (
            <div>
              <h3 className="text-sm font-medium mb-1">Bahan</h3>
              <p className="text-sm text-muted-foreground">{product.materials}</p>
            </div>
          )}

          {colorVariants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Warna</h3>
              <div className="flex flex-wrap gap-2">
                {colorVariants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      selectedVariant === v.id ? "border-primary bg-primary/5 text-primary" : "hover:border-muted-foreground"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizeVariants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Ukuran</h3>
              <div className="flex flex-wrap gap-2">
                {sizeVariants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      selectedVariant === v.id ? "border-primary bg-primary/5 text-primary" : "hover:border-muted-foreground"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium mb-2">Jumlah</h3>
            <div className="flex items-center border rounded-lg w-fit">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 flex items-center justify-center">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-14 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button size="lg" className="flex-1 rounded-full gap-2" onClick={handleAddToCart}>
              <ShoppingBag className="h-5 w-5" />
              Keranjang
            </Button>
            <Button size="lg" variant="outline" className="rounded-full">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>Estimasi sampai dalam 3-5 hari kerja</span>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Deskripsi Produk</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
