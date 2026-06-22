import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadToCloudinary, UploadFolder } from "@/lib/cloudinary"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as UploadFolder) || "products"

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Format file tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 })
    }

    const validFolders: UploadFolder[] = ["products", "banners", "avatars", "categories"]
    if (!validFolders.includes(folder)) {
      return NextResponse.json({ error: "Folder tidak valid" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await uploadToCloudinary(buffer, { folder })

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Gagal mengunggah gambar" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const publicId = searchParams.get("publicId")

    if (!publicId) {
      return NextResponse.json({ error: "publicId diperlukan" }, { status: 400 })
    }

    const { deleteFromCloudinary } = await import("@/lib/cloudinary")
    const deleted = await deleteFromCloudinary(publicId)

    if (!deleted) {
      return NextResponse.json({ error: "Gagal menghapus gambar dari Cloudinary" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Gambar berhasil dihapus" })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Gagal menghapus gambar" }, { status: 500 })
  }
}