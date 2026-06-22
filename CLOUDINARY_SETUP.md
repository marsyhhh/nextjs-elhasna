# 🖼️ Panduan Lengkap Implementasi Cloudinary Upload

## 📋 Daftar Isi
1. [Setup Environment](#setup-environment)
2. [Konfigurasi Cloudinary](#konfigurasi-cloudinary)
3. [API Routes Backend](#api-routes-backend)
4. [Komponen Frontend](#komponen-frontend)
5. [Integrasi dengan Prisma](#integrasi-dengan-prisma)
6. [Optimasi Gambar di Next.js](#optimasi-gambar-di-nextjs)
7. [Contoh Penggunaan Lengkap](#contoh-penggunaan-lengkap)

---

## 1. Setup Environment

### 1.1 Environment Variables

Tambahkan ke file `.env.local`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="dcxljvv6p"
CLOUDINARY_API_KEY="433212555843986"
CLOUDINARY_API_SECRET="oG5cSHisAa4oV4nZ-S5xhB79W0E"

# Jangan lupa untuk mengubah credentials ini di production!
# Dapatkan dari: https://cloudinary.com/console
```

**Penjelasan:**
- `CLOUDINARY_CLOUD_NAME`: Nama cloud Anda di Cloudinary
- `CLOUDINARY_API_KEY`: Key API untuk upload programmatic
- `CLOUDINARY_API_SECRET`: Secret key (jangan pernah expose ke frontend)

### 1.2 Package Installation

Package sudah terinstall, tapi jika perlu reinstall:

```bash
npm install cloudinary next-image-export-optimizer
# atau
pnpm add cloudinary next-image-export-optimizer
```

---

## 2. Konfigurasi Cloudinary

### 2.1 Utility File: `src/lib/cloudinary.ts`

File ini sudah ada dan mencakup:

```typescript
import { v2 as cloudinary } from "cloudinary"

// Konfigurasi
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Upload dengan folder structure
export async function uploadToCloudinary(
  file: Buffer | string,
  options: UploadOptions
): Promise<UploadResult>

// Hapus gambar dari Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<boolean>

// Generate URL yang sudah dioptimasi
export function getOptimizedUrl(publicId: string, options?: TransformOptions): string

// Generate URL thumbnail
export function getThumbnailUrl(publicId: string, size?: number): string
```

---

## 3. API Routes Backend

### 3.1 Upload API: `src/app/api/upload/route.ts`

**POST `/api/upload`** - Upload gambar ke Cloudinary

```typescript
// Request Body
FormData {
  file: File           // Gambar yang akan diupload
  folder: string       // "products" | "banners" | "avatars" | "categories"
}

// Response
{
  success: true,
  data: {
    url: string        // URL aman dari Cloudinary (secure_url)
    publicId: string   // Public ID untuk referensi di database
    width: number
    height: number
    format: string     // Format gambar (webp, jpg, dll)
  }
}
```

**DELETE `/api/upload?publicId=xxxxx`** - Hapus gambar dari Cloudinary

```typescript
// Response
{
  success: true,
  message: "Gambar berhasil dihapus"
}
```

### 3.2 Products API: `src/app/api/products/route.ts`

**POST `/api/products`** - Simpan produk dengan gambar ke database

```typescript
// Request Body
{
  name: string              // Nama produk
  slug?: string             // Auto-generate jika tidak ada
  description: string
  price: number             // Harga dalam IDR
  costPrice?: number
  weight: number            // Berat dalam gram
  stock: number
  materials?: string
  images: string[]          // Array URL dari Cloudinary
  categoryId: string
}

// Response
{
  success: true,
  data: {
    id: string
    name: string
    slug: string
    images: string[]
    price: number
    ...
  }
}
```

---

## 4. Komponen Frontend

### 4.1 Image Upload Component: `src/components/admin/image-upload.tsx`

Komponen reusable untuk upload gambar dengan fitur:
- ✅ Drag & drop
- ✅ Multiple file selection
- ✅ Preview gambar
- ✅ Loading state
- ✅ Delete gambar

**Penggunaan:**

```typescript
import { ImageUpload } from "@/components/admin/image-upload"

export function MyComponent() {
  const [images, setImages] = useState<string[]>([])

  return (
    <ImageUpload 
      folder="products"
      maxFiles={5}
      onUploadSuccess={(urls) => setImages(urls)}
      onUploadError={(error) => console.error(error)}
    />
  )
}
```

**Props:**
- `folder`: `"products"` | `"banners"` | `"avatars"` | `"categories"`
- `maxFiles`: Jumlah maksimal file (default: 3)
- `onUploadSuccess`: Callback ketika upload berhasil
- `onUploadError`: Callback ketika ada error

### 4.2 Product Form: `src/app/admin/products/new/page.tsx`

Sudah diintegrasikan dengan `ImageUpload` component untuk:
- Input informasi produk
- Upload gambar
- Simpan ke database via API

---

## 5. Integrasi dengan Prisma

### 5.1 Schema Prisma

Model `Product` sudah memiliki field `images`:

```prisma
model Product {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String    @db.Text
  price       Int
  discountPrice Int?
  costPrice   Int?
  weight      Int
  stock       Int       @default(0)
  images      String[]  // ← Array URL dari Cloudinary
  materials   String?
  isActive    Boolean   @default(true)
  isFlashSale Boolean   @default(false)
  flashSaleEndsAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
}
```

### 5.2 Contoh: Simpan Produk dengan Gambar

```typescript
// File: src/app/api/products/route.ts

export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug || generateSlug(body.name),
        description: body.description,
        price: body.price,
        costPrice: body.costPrice || null,
        weight: body.weight,
        stock: body.stock,
        materials: body.materials || null,
        images: body.images,  // ← Array URL dari Cloudinary
        categoryId: body.categoryId,
      },
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan produk" }, { status: 500 })
  }
}
```

### 5.3 Contoh: Ambil dan Tampilkan Produk

```typescript
// Ambil dari database
const product = await prisma.product.findUnique({
  where: { id: productId },
})

// Gunakan images dari database
const imageUrls = product.images  // ['https://res.cloudinary.com/...', ...]

// Tampilkan di frontend
images.map((url) => (
  <img key={url} src={url} alt="product" />
))
```

---

## 6. Optimasi Gambar di Next.js

### 6.1 Update `next.config.ts`

```typescript
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",  // Domain Cloudinary
      },
      // Atau allow semua domain (kurang aman)
      { protocol: "https", hostname: "**" },
    ],
  },
  serverExternalPackages: ["bcryptjs"],
}

export default nextConfig
```

### 6.2 Penggunaan Next.js Image Component

**Dasar:**

```typescript
import Image from "next/image"

export function ProductImage({ url, alt }: { url: string; alt: string }) {
  return (
    <Image
      src={url}
      alt={alt}
      width={400}
      height={400}
      className="object-cover"
    />
  )
}
```

**Dengan Transformasi Cloudinary:**

```typescript
import { getOptimizedUrl } from "@/lib/cloudinary"

export function OptimizedProductImage({ 
  publicId, 
  alt 
}: { 
  publicId: string
  alt: string 
}) {
  const url = getOptimizedUrl(publicId, {
    width: 400,
    height: 400,
    quality: 80,
    format: "webp"  // Format optimal
  })

  return (
    <Image
      src={url}
      alt={alt}
      width={400}
      height={400}
      className="object-cover"
    />
  )
}
```

**Responsive Image:**

```typescript
export function ResponsiveProductImage({ url }: { url: string }) {
  return (
    <div className="relative w-full aspect-square">
      <Image
        src={url}
        alt="Product"
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  )
}
```

### 6.3 Keuntungan Optimasi

✅ **Automatic Format**: Cloudinary auto-convert ke WebP/AVIF
✅ **Quality Optimization**: Kompresi otomatis tanpa mengurangi kualitas
✅ **Responsive**: Berbagai ukuran untuk berbagai device
✅ **Lazy Loading**: Next.js Image component lazy-load by default
✅ **CDN Global**: Cloudinary serve dari CDN terdekat

---

## 7. Contoh Penggunaan Lengkap

### 7.1 Workflow Frontend: Upload → Save to DB

```typescript
// src/app/admin/products/new/page.tsx

"use client"

import { useState } from "react"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function NewProductPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadedImages.length) {
      toast.error("Tambahkan minimal 1 gambar")
      return
    }

    setLoading(true)

    try {
      // STEP 1: Kirim data produk + URL gambar ke API
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseInt(formData.price),
          images: uploadedImages,  // ← URL dari Cloudinary
          categoryId: formData.categoryId,
          weight: 500,
          stock: 100,
        }),
      })

      if (!response.ok) {
        throw new Error("Gagal menyimpan produk")
      }

      const result = await response.json()
      
      // STEP 2: Sukses! Gambar sudah tersimpan di Cloudinary
      //         dan URL sudah tersimpan di database
      toast.success("Produk berhasil dibuat!")
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Input Fields */}
      <div>
        <label>Nama Produk</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Deskripsi</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Harga</label>
        <Input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
          required
        />
      </div>

      {/* Image Upload Component */}
      <div>
        <label>Gambar Produk</label>
        <ImageUpload
          folder="products"
          maxFiles={5}
          onUploadSuccess={setUploadedImages}
          onUploadError={(error) => toast.error(error)}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Menyimpan..." : "Tambah Produk"}
      </Button>
    </form>
  )
}
```

### 7.2 Workflow Backend: Save ke Database

```typescript
// src/app/api/products/route.ts

import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // STEP 1: Validasi data
    if (!body.name || !body.images?.length) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      )
    }

    // STEP 2: Simpan ke Prisma
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.name.toLowerCase().replace(/\s+/g, "-"),
        description: body.description,
        price: body.price,
        weight: body.weight,
        stock: body.stock,
        images: body.images,  // ← Array URL dari Cloudinary
        categoryId: body.categoryId,
      },
    })

    // STEP 3: Return data yang sudah tersimpan
    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
```

### 7.3 Menampilkan Produk di Frontend

```typescript
// src/components/product-card.tsx

import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  images: string[]  // ← URL dari database
}

export function ProductCard({ id, name, slug, price, images }: ProductCardProps) {
  return (
    <Link href={`/products/${slug}`}>
      <div className="rounded-lg overflow-hidden border">
        {/* Image dengan Next.js Image untuk optimasi */}
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={images[0]}  // Gambar pertama
            alt={name}
            fill
            className="object-cover hover:scale-105 transition-transform"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-blue-600 font-bold">Rp {price.toLocaleString()}</p>
        </div>
      </div>
    </Link>
  )
}
```

### 7.4 Menampilkan Detail Produk

```typescript
// src/app/products/[slug]/page.tsx

import Image from "next/image"
import { prisma } from "@/lib/prisma"

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  })

  if (!product) return <div>Produk tidak ditemukan</div>

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          {product.images.map((image, i) => (
            <div key={i} className="relative w-full aspect-square bg-gray-100">
              <Image
                src={image}
                alt={`${product.name} - ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.category.name}</p>
          <p className="text-2xl font-bold text-blue-600 mb-4">
            Rp {product.price.toLocaleString()}
          </p>
          <p className="text-gray-700 mb-6">{product.description}</p>
          {/* Add to cart button, etc */}
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 Folder Structure di Cloudinary

```
elhasna-hijab/
├── products/           # Gambar produk
│   ├── xxxxx.webp
│   ├── yyyyy.webp
│   └── zzzzz.webp
├── banners/           # Gambar banner promosi
├── avatars/           # Gambar profil pengguna
└── categories/        # Gambar kategori
```

---

## 🔒 Keamanan

### ✅ Best Practices

1. **API Secret di Backend Only**
   - `CLOUDINARY_API_SECRET` hanya di `.env` (server-side)
   - Jangan expose ke frontend

2. **Authorization Check**
   - Semua upload API perlu `auth()` check
   - Hanya ADMIN/SUPERADMIN yang bisa upload

3. **File Type Validation**
   - Check di frontend dan backend
   - Allowed: JPEG, PNG, WebP, GIF

4. **File Size Limit**
   - Max 5MB per file
   - Validasi di backend

5. **Public ID Management**
   - Simpan public_id di database jika perlu delete
   - Gunakan untuk tracking dan management

---

## 🐛 Troubleshooting

### Image tidak muncul
```typescript
// Check:
1. Environment variables sudah ter-set
2. Folder di next.config.ts sudah include res.cloudinary.com
3. URL dari Cloudinary valid dan accessible

// Debug:
console.log(process.env.CLOUDINARY_CLOUD_NAME)  // Harus ada value
```

### Upload gagal
```typescript
// Check:
1. File size < 5MB
2. File format valid (JPEG, PNG, WebP, GIF)
3. User punya role ADMIN/SUPERADMIN
4. Network/CORS issue

// Try:
- Check browser console untuk error detail
- Lihat network tab untuk response error
```

### Transformasi tidak bekerja
```typescript
// Ensure quality syntax benar
const url = getOptimizedUrl(publicId, {
  width: 400,
  height: 400,
  quality: 80,      // ✅ 1-100
  format: "webp"    // ✅ "webp", "auto", "jpg"
})
```

---

## 📚 Referensi

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Next.js Image Documentation](https://nextjs.org/docs/app/api-reference/components/image)
- [Prisma Documentation](https://www.prisma.io/docs)
- [FormData MDN](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

---

**Terakhir diperbarui**: 2024
**Versi**: 1.0
