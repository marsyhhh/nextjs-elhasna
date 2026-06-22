import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { variants: true, category: true, reviews: { include: { user: true } } },
  })

  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await req.json()
    const updateData: any = { ...data }

    if (data.name) {
      updateData.slug = generateSlug(data.name)
    }

    delete updateData.id

    if (data.variants) {
      await prisma.productVariant.deleteMany({ where: { productId: id } })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        variants: data.variants
          ? {
              create: data.variants.map((v: any) => ({
                name: v.name,
                type: v.type,
                stock: v.stock || 0,
              })),
            }
          : undefined,
      },
      include: { variants: true, category: true },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Gagal mengupdate produk" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ message: "Produk berhasil dihapus" })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 })
  }
}
