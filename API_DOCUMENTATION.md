# 📡 API Documentation - Cloudinary Upload System

## Overview

REST API untuk mengelola upload gambar ke Cloudinary dan penyimpanan data ke Prisma database.

---

## Base URL

```
http://localhost:3000/api
```

---

## Endpoints

### 1. Upload Image

**Endpoint:** `POST /upload`

**Authentication:** Required (Admin/Superadmin only)

**Description:** Upload gambar ke Cloudinary

#### Request

**Content-Type:** `multipart/form-data`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | ✅ | Gambar yang akan diupload |
| `folder` | string | ❌ | Folder tujuan di Cloudinary (default: "products") |

**Valid folders:**
- `products` - Gambar produk
- `banners` - Gambar banner/promosi
- `avatars` - Gambar profil pengguna
- `categories` - Gambar kategori

**Example:**

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -F "file=@./image.jpg" \
  -F "folder=products"
```

**JavaScript Example:**

```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('folder', 'products')

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})

const result = await response.json()
console.log(result.data.url)  // URL dari Cloudinary
```

#### Response

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/dcxljvv6p/image/upload/v1234567890/elhasna-hijab/products/abc123.webp",
    "publicId": "elhasna-hijab/products/abc123",
    "width": 1920,
    "height": 1080,
    "format": "webp"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `File tidak ditemukan` | File parameter kosong |
| 400 | `Format file tidak didukung` | File bukan JPEG, PNG, WebP, atau GIF |
| 400 | `Ukuran file maksimal 5MB` | File size lebih dari 5MB |
| 400 | `Folder tidak valid` | Folder parameter tidak valid |
| 401 | `Unauthorized` | User tidak authenticated atau bukan Admin |
| 500 | `Gagal mengunggah gambar` | Server error |

#### File Constraints

- **Max Size:** 5 MB
- **Allowed Types:** JPEG, PNG, WebP, GIF
- **Transformation:** Auto quality, auto format

---

### 2. Delete Image

**Endpoint:** `DELETE /upload`

**Authentication:** Required (Admin/Superadmin only)

**Description:** Hapus gambar dari Cloudinary

#### Request

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `publicId` | string | ✅ | Public ID gambar di Cloudinary |

**Example:**

```bash
curl -X DELETE "http://localhost:3000/api/upload?publicId=elhasna-hijab/products/abc123"
```

**JavaScript Example:**

```javascript
const publicId = 'elhasna-hijab/products/abc123'

const response = await fetch(`/api/upload?publicId=${publicId}`, {
  method: 'DELETE'
})

const result = await response.json()
```

#### Response

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Gambar berhasil dihapus"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `publicId diperlukan` | Query parameter publicId tidak ada |
| 401 | `Unauthorized` | User tidak authenticated |
| 500 | `Gagal menghapus gambar` | Server error |

---

### 3. Create Product

**Endpoint:** `POST /products`

**Authentication:** Required (Admin/Superadmin only)

**Description:** Buat produk baru dengan gambar

#### Request

**Content-Type:** `application/json`

```json
{
  "name": "Hijab Katun Premium",
  "slug": "hijab-katun-premium",
  "description": "Hijab premium dari katun terbaik...",
  "price": 89000,
  "discountPrice": 69000,
  "costPrice": 45000,
  "weight": 200,
  "stock": 100,
  "materials": "Katun 100%, Lembab",
  "images": [
    "https://res.cloudinary.com/dcxljvv6p/image/upload/v1234567890/elhasna-hijab/products/img1.webp",
    "https://res.cloudinary.com/dcxljvv6p/image/upload/v1234567890/elhasna-hijab/products/img2.webp"
  ],
  "categoryId": "cat-123",
  "isFlashSale": false,
  "variants": [
    {
      "name": "Merah",
      "type": "color",
      "stock": 50
    },
    {
      "name": "Biru",
      "type": "color",
      "stock": 50
    }
  ]
}
```

**Required Fields:**
- `name` - Nama produk
- `description` - Deskripsi produk
- `price` - Harga dalam IDR
- `weight` - Berat dalam gram
- `stock` - Stok produk
- `images` - Array URL dari Cloudinary
- `categoryId` - ID kategori

**Optional Fields:**
- `slug` - Custom slug (auto-generate jika kosong)
- `discountPrice` - Harga diskon
- `costPrice` - Harga modal
- `materials` - Bahan produk
- `isFlashSale` - Flag flash sale
- `variants` - Array varian produk

#### Response

**Status Code:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "prod-123",
    "name": "Hijab Katun Premium",
    "slug": "hijab-katun-premium",
    "description": "...",
    "price": 89000,
    "discountPrice": 69000,
    "costPrice": 45000,
    "weight": 200,
    "stock": 100,
    "materials": "Katun 100%, Lembah",
    "images": [
      "https://res.cloudinary.com/.../img1.webp",
      "https://res.cloudinary.com/.../img2.webp"
    ],
    "categoryId": "cat-123",
    "isFlashSale": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Data tidak lengkap` | Required fields kosong |
| 400 | `Slug sudah digunakan` | Slug sudah ada di database |
| 401 | `Unauthorized` | User tidak authenticated |
| 500 | `Gagal menyimpan produk` | Server error |

---

### 4. Get Products

**Endpoint:** `GET /products`

**Authentication:** Optional

**Description:** Ambil daftar produk dengan filter dan pagination

#### Request

**Query Parameters:**

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `categoryId` | string | `cat-123` | Filter by category ID |
| `limit` | number | `10` | Jumlah hasil per page (default: 10) |
| `page` | number | `1` | Halaman (default: 1) |

**Examples:**

```bash
# Ambil 10 produk pertama
GET /api/products

# Ambil produk dari kategori tertentu
GET /api/products?categoryId=cat-123

# Pagination: halaman 2 dengan 20 hasil per halaman
GET /api/products?page=2&limit=20

# Kombinasi
GET /api/products?categoryId=cat-123&page=1&limit=15
```

#### Response

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "prod-1",
      "name": "Hijab Premium",
      "slug": "hijab-premium",
      "description": "...",
      "price": 89000,
      "images": [
        "https://res.cloudinary.com/.../img1.webp"
      ],
      "categoryId": "cat-123",
      "category": {
        "id": "cat-123",
        "name": "Hijab Katun"
      },
      "stock": 100,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

## Authentication

Semua endpoint `/upload` dan `/products` (POST) memerlukan authentication dengan NextAuth.

```typescript
// Automatic dengan SessionProvider
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Process request...
}
```

---

## Error Handling

### Generic Error Response Format

```json
{
  "error": "Error message here"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

⚠️ **Not implemented yet** - Recommended untuk production:

```typescript
// Install: npm install next-rate-limit
import { RateLimit } from 'next-rate-limit'

const uploadLimit = new RateLimit({
  interval: 60 * 1000,  // 1 minute
  tokensPerInterval: 10  // 10 requests per minute
})

export async function POST(req) {
  await uploadLimit.check(req)  // Throws error jika limit exceeded
  // ...
}
```

---

## Examples

### Complete Upload → Save Flow

```javascript
// 1. Upload gambar ke Cloudinary
async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'products')

  const uploadResponse = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })

  const uploadData = await uploadResponse.json()
  return uploadData.data.url  // ← URL dari Cloudinary
}

// 2. Simpan produk dengan URL gambar
async function createProduct(productData, imageUrls) {
  const saveResponse = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...productData,
      images: imageUrls  // ← Array URL dari Cloudinary
    })
  })

  return saveResponse.json()
}

// 3. Gunakan dalam form
async function handleProductForm(formData, files) {
  try {
    // Upload all files
    const imageUrls = await Promise.all(
      Array.from(files).map(file => uploadImage(file))
    )

    // Save product dengan image URLs
    const result = await createProduct(formData, imageUrls)
    
    console.log('Product created:', result.data.id)
  } catch (error) {
    console.error('Error:', error.message)
  }
}
```

### Using with React Hook Form

```typescript
import { useForm } from 'react-hook-form'

export function ProductForm() {
  const { register, handleSubmit } = useForm()
  const [images, setImages] = useState<string[]>([])

  const onSubmit = async (data) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        images  // ← URLs dari ImageUpload component
      })
    })

    const result = await response.json()
    if (result.success) {
      // Success!
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ImageUpload 
        onUploadSuccess={setImages}
      />
      <button type="submit">Save</button>
    </form>
  )
}
```

---

## Performance Tips

### Upload Performance

```javascript
// ✅ Good: Sequential uploads untuk UI feedback
const uploadFiles = async (files) => {
  const urls = []
  for (const file of files) {
    const url = await uploadImage(file)
    urls.push(url)
    // UI bisa update progress setiap file
  }
  return urls
}

// ✅ Better: Parallel uploads dengan limit
const uploadFilesConcurrently = async (files) => {
  const maxConcurrent = 3
  const urls = []
  
  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent)
    const results = await Promise.all(
      batch.map(file => uploadImage(file))
    )
    urls.push(...results)
  }
  
  return urls
}
```

### Image Load Performance

```typescript
// ✅ Use Next.js Image component
<Image
  src={url}
  alt="..."
  width={400}
  height={400}
  loading="lazy"        // Lazy load
  sizes="..."           // Responsive sizes
/>

// ✅ Use quality optimization
const optimizedUrl = getOptimizedUrl(publicId, {
  width: 400,
  height: 400,
  quality: 80,          // Auto optimize quality
  format: "webp"        // Modern format
})
```

---

## Security Considerations

### ✅ Implemented

- [x] Authentication check pada upload
- [x] File type validation
- [x] File size limit
- [x] API secret only pada backend

### ⚠️ Recommendations

- [ ] Rate limiting untuk upload
- [ ] Virus scanning untuk files
- [ ] IP whitelisting untuk API
- [ ] HTTPS only untuk production
- [ ] CORS configuration untuk domain specific

---

## Testing API

### Using Postman

1. **Upload Image:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/upload`
   - Headers: (Auto set by Postman)
   - Body: `form-data`
     - Key: `file`, Value: (select file)
     - Key: `folder`, Value: `products`

2. **Create Product:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/products`
   - Headers: `Content-Type: application/json`
   - Body: (JSON dari example di atas)

### Using cURL

```bash
# Upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.jpg" \
  -F "folder=products"

# Delete
curl -X DELETE "http://localhost:3000/api/upload?publicId=elhasna-hijab/products/abc"

# Create Product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "price": 50000,
    "images": ["https://..."],
    "categoryId": "cat-1"
  }'
```

---

## Changelog

### v1.0 (Initial Release)
- [x] Upload image endpoint
- [x] Delete image endpoint
- [x] Create product endpoint
- [x] Get products endpoint
- [x] Authentication & authorization
- [x] File validation
- [x] Cloudinary integration

### Planned Features
- [ ] Rate limiting
- [ ] Virus scanning
- [ ] Image cropping API
- [ ] Bulk operations
- [ ] Analytics tracking
- [ ] CDN optimization

---

**Last Updated:** 2024
**API Version:** 1.0
**Status:** Stable
