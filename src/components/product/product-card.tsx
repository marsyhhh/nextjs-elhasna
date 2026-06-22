import Link from "next/link"
import Image from "next/image"
import { Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  discountPrice?: number | null
  image: string
  rating?: number
  reviewCount?: number
  variants?: { name: string; type: string }[]
  isFlashSale?: boolean
}

export function ProductCard({
  name,
  slug,
  price,
  discountPrice,
  image,
  rating = 0,
  reviewCount = 0,
  variants = [],
  isFlashSale,
}: ProductCardProps) {
  const hasDiscount = discountPrice && discountPrice < price
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice!) / price) * 100) : 0

  return (
    <div className="group relative">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted mb-3">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm bg-muted">
            Gambar tidak tersedia
          </div>
        )}

        {isFlashSale && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
            Flash Sale
          </Badge>
        )}

        {hasDiscount && (
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
            -{discountPercent}%
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="h-4 w-4" />
        </Button>

        <Link href={`/products/${slug}`} className="absolute inset-0" />
      </div>

      <Link href={`/products/${slug}`}>
        <div className="space-y-1">
          <p className="text-sm font-medium line-clamp-2 leading-snug">{name}</p>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                {rating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviewCount} terjual)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="font-semibold text-sm">{formatPrice(discountPrice!)}</span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(price)}
                </span>
              </>
            ) : (
              <span className="font-semibold text-sm">{formatPrice(price)}</span>
            )}
          </div>

          {variants.length > 0 && (
            <div className="flex items-center gap-1 pt-1">
              {variants.slice(0, 5).map((v, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: v.type === "color" ? v.name : "#e5e7eb" }}
                  title={v.name}
                />
              ))}
              {variants.length > 5 && (
                <span className="text-xs text-muted-foreground">+{variants.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
