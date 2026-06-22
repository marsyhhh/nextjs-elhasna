import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"
import { auth } from "@/lib/auth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await req.json()
    const updateData: Record<string, unknown> = {}

    if (data.name) {
      updateData.name = data.name
      updateData.slug = generateSlug(data.name)
    }
    if (data.description !== undefined) {
      updateData.description = data.description || null
    }
    if (data.image !== undefined) {
      updateData.image = data.image || null
    }
    if (data.order !== undefined) {
      updateData.order = data.order
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Update category error:", error)
    return NextResponse.json({ error: "Gagal mengupdate kategori" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    const productCount = await prisma.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus kategori yang memiliki ${productCount} produk. Pindahkan produk terlebih dahulu.` },
        { status: 400 }
      )
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 })
  }
}
