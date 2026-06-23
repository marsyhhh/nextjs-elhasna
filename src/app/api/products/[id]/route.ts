import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { variants: true, category: true, reviews: { include: { user: true } }, combinations: { include: { variant1: true, variant2: true } } },
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
    delete updateData.variants
    delete updateData.combinations

    // Update product base data
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        slug: data.name ? generateSlug(data.name) : undefined,
      },
    })

    // Recreate variants and combinations if provided
    if (data.variants) {
      await prisma.productVariantCombination.deleteMany({ where: { productId: id } })
      await prisma.productVariant.deleteMany({ where: { productId: id } })

      let totalStock = product.stock
      const variantNameMap: Record<string, string> = {}

      for (const v of data.variants) {
        const created = await prisma.productVariant.create({
          data: { productId: id, name: v.name, type: v.type },
        })
        variantNameMap[created.name] = created.id
      }

      if (data.combinations?.length) {
        for (const c of data.combinations) {
          await prisma.productVariantCombination.create({
            data: {
              productId: id,
              variant1Id: variantNameMap[c.variant1Name],
              variant2Id: c.variant2Name ? variantNameMap[c.variant2Name] : null,
              stock: c.stock || 0,
            },
          })
        }
        totalStock = data.combinations.reduce((sum: number, c: any) => sum + (c.stock || 0), 0)
      }

      await prisma.product.update({
        where: { id },
        data: { stock: totalStock },
      })
    }

    const result = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, category: true, combinations: { include: { variant1: true, variant2: true } } },
    })

    return NextResponse.json(result)
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
