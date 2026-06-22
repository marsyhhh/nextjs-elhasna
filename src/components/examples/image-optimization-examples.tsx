/**
 * CONTOH LENGKAP: Menampilkan Gambar dengan Optimasi di Frontend
 * 
 * File ini menunjukkan berbagai cara menggunakan gambar dari Cloudinary
 * dengan optimasi Next.js Image component
 */

import Image from "next/image"
import { getOptimizedUrl } from "@/lib/cloudinary"

/**
 * CONTOH 1: Product Card dengan Single Image
 */
export function ProductCardExample() {
  const product = {
    id: "1",
    name: "Hijab Premium",
    price: 89000,
    image: "https://res.cloudinary.com/dcxljvv6p/image/upload/v123/elhasna-hijab/products/product-1.webp"
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Image dengan Next.js optimization */}
      <div className="relative w-full aspect-square bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover hover:scale-105 transition-transform"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}  // Set true untuk above-the-fold images
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-blue-600 font-bold">Rp {product.price.toLocaleString()}</p>
      </div>
    </div>
  )
}

/**
 * CONTOH 2: Product Gallery dengan Multiple Images
 */
export function ProductGalleryExample() {
  const product = {
    id: "1",
    name: "Hijab Premium",
    images: [
      "https://res.cloudinary.com/dcxljvv6p/image/upload/v123/elhasna-hijab/products/product-1.webp",
      "https://res.cloudinary.com/dcxljvv6p/image/upload/v123/elhasna-hijab/products/product-2.webp",
      "https://res.cloudinary.com/dcxljvv6p/image/upload/v123/elhasna-hijab/products/product-3.webp",
    ]
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full aspect-square bg-gray-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-4 gap-2">
        {product.images.map((image, i) => (
          <div key={i} className="relative w-full aspect-square bg-gray-100 rounded cursor-pointer hover:opacity-75">
            <Image
              src={image}
              alt={`${product.name} - ${i + 1}`}
              fill
              className="object-cover rounded"
              sizes="80px"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * CONTOH 3: Responsive Banner dengan Transformasi Cloudinary
 */
export function ResponsiveBannerExample() {
  // URL yang sudah include transformasi Cloudinary
  const bannerUrl = "https://res.cloudinary.com/dcxljvv6p/image/upload/c_fill,g_auto,q_auto:good,f_auto,w_1920,h_500/elhasna-hijab/banners/banner-1.webp"

  return (
    <div className="relative w-full h-64 md:h-96 bg-gray-200">
      <Image
        src={bannerUrl}
        alt="Promo Banner"
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />

      {/* Overlay Content */}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold">Flash Sale 50%</h1>
          <p className="text-lg md:text-xl mt-2">Hari Ini Saja!</p>
        </div>
      </div>
    </div>
  )
}

/**
 * CONTOH 4: Category Card dengan Gambar
 */
export function CategoryCardExample() {
  const category = {
    id: "1",
    name: "Hijab Katun",
    slug: "hijab-katun",
    image: "https://res.cloudinary.com/dcxljvv6p/image/upload/c_fill,g_auto,h_200,w_200,q_auto:good,f_auto/elhasna-hijab/categories/category-1.webp"
  }

  return (
    <a href={`/products?category=${category.slug}`} className="block">
      <div className="text-center group">
        {/* Image */}
        <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>

        {/* Category Name */}
        <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
          {category.name}
        </h3>
      </div>
    </a>
  )
}

/**
 * CONTOH 5: Gambar dengan Fallback (jika URL tidak valid)
 */
export function ProductImageWithFallback({
  src,
  alt,
  fallbackSrc = "https://res.cloudinary.com/dcxljvv6p/image/upload/v123/elhasna-hijab/placeholder.webp"
}: {
  src?: string | null
  alt: string
  fallbackSrc?: string
}) {
  const imageUrl = src || fallbackSrc

  return (
    <div className="relative w-full aspect-square bg-gray-100">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, 50vw"
        onError={(e) => {
          // Jika gambar error, gunakan fallback
          e.currentTarget.src = fallbackSrc
        }}
      />
    </div>
  )
}

/**
 * CONTOH 6: Avatar Pengguna dengan Thumbnail Optimization
 */
export function UserAvatarExample({ 
  imageUrl, 
  userName 
}: { 
  imageUrl?: string | null
  userName: string 
}) {
  // Generate 150x150 thumbnail dari Cloudinary
  const avatarUrl = imageUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`

  return (
    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
      <Image
        src={avatarUrl}
        alt={userName}
        fill
        className="object-cover"
        sizes="40px"
      />
    </div>
  )
}

/**
 * CONTOH 7: Image Gallery Grid untuk Admin Product Edit
 */
export function ImageGalleryGridExample({ 
  images 
}: { 
  images: string[] 
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {images.map((image, index) => (
        <div key={index} className="relative group">
          {/* Image */}
          <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden">
            <Image
              src={image}
              alt={`Image ${index + 1}`}
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>

          {/* Delete/Edit Button on Hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button className="bg-red-600 text-white p-2 rounded">🗑️ Delete</button>
            <button className="bg-blue-600 text-white p-2 rounded">✏️ Edit</button>
          </div>

          {/* Position Badge */}
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            #{index + 1}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * CONTOH 8: Lazy Loading Grid dengan Multiple Products
 */
export function ProductGridExample({ 
  products 
}: { 
  products: Array<{
    id: string
    name: string
    slug: string
    price: number
    image: string
  }>
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <a key={product.id} href={`/products/${product.slug}`}>
          <div className="rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image - Lazy load untuk product yang tidak visible */}
            <div className="relative w-full aspect-square bg-gray-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"  // ← Lazy load
              />
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="font-semibold text-sm truncate">{product.name}</h3>
              <p className="text-blue-600 font-bold text-sm">Rp {product.price.toLocaleString()}</p>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

/**
 * CONTOH 9: Image dengan Custom Transformation
 */
export function CustomTransformedImage({
  publicId,
  width = 400,
  height = 400,
  quality = 80
}: {
  publicId: string
  width?: number
  height?: number
  quality?: number
}) {
  // Generate URL dengan custom transformation
  const url = getOptimizedUrl(publicId, {
    width,
    height,
    quality,
    format: "webp"
  })

  return (
    <Image
      src={url}
      alt="Optimized image"
      width={width}
      height={height}
      className="object-cover"
    />
  )
}

/**
 * CONTOH 10: Comparison: Dengan vs Tanpa Next.js Image
 * 
 * TANPA Next.js Image (tidak recommended):
 * <img src={imageUrl} alt="..." />
 * ❌ Tidak ada lazy loading
 * ❌ Tidak auto-format optimization
 * ❌ Tidak responsive
 * ❌ Cumulative Layout Shift (CLS) risk
 * 
 * DENGAN Next.js Image (recommended):
 * <Image src={imageUrl} alt="..." fill sizes="..." />
 * ✅ Automatic lazy loading
 * ✅ Auto WebP/AVIF format
 * ✅ Responsive srcset
 * ✅ Prevents CLS
 * ✅ Built-in optimization
 */
