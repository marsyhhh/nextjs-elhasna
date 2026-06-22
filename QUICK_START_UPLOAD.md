# 🚀 Quick Start Guide - Cloudinary Upload

Panduan cepat untuk mulai menggunakan fitur upload gambar dengan Cloudinary.

## ✅ Checklist Setup

- [x] **Environment Variables** (sudah ada di `.env`)
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

- [x] **Package Installation** (sudah terinstall)
  - `cloudinary`
  - `next-image-export-optimizer`

- [x] **Backend Files** (sudah ada)
  - [src/lib/cloudinary.ts](../src/lib/cloudinary.ts) - Utility functions
  - [src/app/api/upload/route.ts](../src/app/api/upload/route.ts) - Upload API
  - [src/app/api/products/route.ts](../src/app/api/products/route.ts) - Products API

- [x] **Frontend Files** (baru ditambahkan)
  - [src/components/admin/image-upload.tsx](../src/components/admin/image-upload.tsx) - Upload component
  - [src/components/admin/product-form-with-upload.tsx](../src/components/admin/product-form-with-upload.tsx) - Product form
  - [src/components/admin/banner-upload-form.tsx](../src/components/admin/banner-upload-form.tsx) - Banner form
  - [src/components/admin/category-upload-form.tsx](../src/components/admin/category-upload-form.tsx) - Category form

- [x] **Configuration** (sudah ada)
  - [next.config.ts](../next.config.ts) - Image domain configuration
  - [prisma/schema.prisma](../prisma/schema.prisma) - Product model dengan images array

---

## 🎯 5 Menit Setup

### Step 1: Verify Environment Variables

```bash
# Pastikan .env sudah berisi:
echo $CLOUDINARY_CLOUD_NAME    # Harus ada output
echo $CLOUDINARY_API_KEY        # Harus ada output
echo $CLOUDINARY_API_SECRET     # Harus ada output
```

### Step 2: Test API Upload

```bash
# Start server
npm run dev

# Test upload via curl
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg" \
  -F "folder=products"
```

### Step 3: Import Component

```typescript
import { ImageUpload } from "@/components/admin/image-upload"
```

### Step 4: Use in Form

```typescript
const [images, setImages] = useState<string[]>([])

<ImageUpload 
  folder="products"
  maxFiles={5}
  onUploadSuccess={setImages}
/>
```

### Step 5: Save to Database

```typescript
const response = await fetch("/api/products", {
  method: "POST",
  body: JSON.stringify({
    name: "Produk",
    price: 50000,
    images: images,  // ← URL dari Cloudinary
    categoryId: "cat-id"
  })
})
```

---

## 📚 Use Cases

### Case 1: Upload Produk Baru

**File**: [src/app/admin/products/new/page.tsx](../src/app/admin/products/new/page.tsx)

```typescript
import { ImageUpload } from "@/components/admin/image-upload"

export default function NewProductPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  return (
    <ImageUpload 
      folder="products"
      maxFiles={5}
      onUploadSuccess={setUploadedImages}
    />
  )
}
```

**API**: `POST /api/products`

### Case 2: Upload Banner Promosi

**File**: [src/components/admin/banner-upload-form.tsx](../src/components/admin/banner-upload-form.tsx)

```typescript
import { BannerUploadForm } from "@/components/admin/banner-upload-form"

export default function AdminBannerPage() {
  return <BannerUploadForm />
}
```

**Folder**: `banners`
**Max Files**: `1`

### Case 3: Upload Kategori

**File**: [src/components/admin/category-upload-form.tsx](../src/components/admin/category-upload-form.tsx)

```typescript
import { CategoryUploadForm } from "@/components/admin/category-upload-form"

export default function AdminCategoryPage() {
  return <CategoryUploadForm />
}
```

**Folder**: `categories`
**Max Files**: `1`

### Case 4: Tampilkan Gambar di Frontend

**File**: [src/components/examples/image-optimization-examples.tsx](../src/components/examples/image-optimization-examples.tsx)

```typescript
import Image from "next/image"

export function ProductImage({ url }: { url: string }) {
  return (
    <Image
      src={url}
      alt="Product"
      width={400}
      height={400}
      className="object-cover"
    />
  )
}
```

---

## 🔧 API Reference

### Upload Image

```bash
POST /api/upload
Content-Type: multipart/form-data

file: File                    # Required
folder: "products"|"banners"|"avatars"|"categories"  # Optional
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "elhasna-hijab/products/xxx",
    "width": 1920,
    "height": 1080,
    "format": "webp"
  }
}
```

### Delete Image

```bash
DELETE /api/upload?publicId=elhasna-hijab/products/xxx
```

**Response:**
```json
{
  "success": true,
  "message": "Gambar berhasil dihapus"
}
```

### Create Product

```bash
POST /api/products
Content-Type: application/json

{
  "name": "Hijab Premium",
  "description": "...",
  "price": 89000,
  "costPrice": 45000,
  "weight": 200,
  "stock": 100,
  "materials": "Katun 100%",
  "images": [
    "https://res.cloudinary.com/.../img1.webp",
    "https://res.cloudinary.com/.../img2.webp"
  ],
  "categoryId": "cat-123"
}
```

---

## 🎨 Component Props

### `<ImageUpload />`

```typescript
interface ImageUploadProps {
  folder?: "products" | "banners" | "avatars" | "categories"
  maxFiles?: number
  onUploadSuccess: (urls: string[]) => void
  onUploadError?: (error: string) => void
}
```

**Fitur:**
- Drag & drop
- Multiple file selection
- Preview image
- Loading state
- Delete button

---

## 🖼️ Image Optimization

### Dari Cloudinary

```typescript
import { getOptimizedUrl } from "@/lib/cloudinary"

const url = getOptimizedUrl("publicId", {
  width: 400,
  height: 400,
  quality: 80,
  format: "webp"
})
```

### Dari Next.js

```typescript
import Image from "next/image"

<Image
  src={imageUrl}
  alt="Product"
  width={400}
  height={400}
  sizes="(max-width: 640px) 100vw, 50vw"
  loading="lazy"
/>
```

---

## 🐛 Debugging

### Issue: Gambar tidak muncul

```typescript
// Check 1: Verify environment variables
console.log(process.env.CLOUDINARY_CLOUD_NAME)

// Check 2: Verify image URL
fetch(imageUrl)  // Should return 200

// Check 3: Check next.config.ts
// Pastikan res.cloudinary.com ada di remotePatterns
```

### Issue: Upload failed

```typescript
// Check size
file.size <= 5 * 1024 * 1024  // 5MB

// Check format
['image/jpeg', 'image/png', 'image/webp'].includes(file.type)

// Check auth
session?.user?.role === 'ADMIN'
```

### Issue: Transformasi tidak bekerja

```typescript
// Format yang valid
{
  width: 400,           // ✅
  height: 400,          // ✅
  quality: 80,          // ✅ (1-100)
  format: "webp"        // ✅ ("webp", "auto", "jpg")
}
```

---

## 📊 Folder Structure di Cloudinary

```
elhasna-hijab/
├── products/          # Product images (multiple per product)
├── banners/          # Hero/promo banners (1 per banner)
├── avatars/          # User profile pictures
└── categories/       # Category thumbnails
```

---

## 🔐 Security

✅ **Done:**
- Authorization check di API
- File type validation
- File size limit (5MB)
- API Secret hanya di backend

⚠️ **To Remember:**
- Jangan expose `CLOUDINARY_API_SECRET` ke frontend
- Selalu check user role sebelum upload
- Validate file type di backend
- Implement rate limiting untuk production

---

## 📱 Mobile Optimization

Next.js Image component otomatis handle:
- Responsive srcset
- Different formats per device
- Lazy loading
- WebP fallback

Tidak perlu config tambahan!

---

## 🚀 Next Steps

1. **Test Upload**: Buka `/admin/products/new` dan coba upload gambar
2. **Create Produk**: Isi form dan simpan ke database
3. **Lihat di Frontend**: Gambar harus muncul dengan optimasi
4. **Scale Up**: Copy pattern ke case lain (banners, avatars, dll)

---

## 📖 Referensi Lengkap

- [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md) - Dokumentasi lengkap
- [src/lib/cloudinary.ts](../src/lib/cloudinary.ts) - Utility implementation
- [src/components/admin/image-upload.tsx](../src/components/admin/image-upload.tsx) - Component source
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Next.js Image Docs](https://nextjs.org/docs/app/api-reference/components/image)

---

**Siap?** Mulai dengan file ini: [src/app/admin/products/new/page.tsx](../src/app/admin/products/new/page.tsx)

**Tidak berhasil?** Lihat section Debugging di atas atau check logs di browser console.
