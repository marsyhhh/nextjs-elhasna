import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const flashSale = searchParams.get("flash_sale")
  const search = searchParams.get("search")
  const sort = searchParams.get("sort")

  const where: any = { isActive: true }

  if (category) {
    where.category = { slug: category }
  }

  if (flashSale === "true") {
    where.isFlashSale = true
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  let orderBy: any = { createdAt: "desc" }

  if (sort === "price_asc") orderBy = { price: "asc" }
  else if (sort === "price_desc") orderBy = { price: "desc" }
  else if (sort === "created_at_asc") orderBy = { createdAt: "asc" }
  else if (sort === "name") orderBy = { name: "asc" }

  const products = await prisma.product.findMany({
    where,
    include: { variants: true, category: true },
    orderBy,
  })

  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const slug = generateSlug(data.name)

    const existing = await prisma.product.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "Produk dengan nama ini sudah ada" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        discountPrice: data.discountPrice || null,
        costPrice: data.costPrice || null,
        weight: data.weight,
        stock: data.stock || 0,
        images: data.images || [],
        materials: data.materials || null,
        isFlashSale: data.isFlashSale || false,
        flashSaleEndsAt: data.flashSaleEndsAt || null,
        categoryId: data.categoryId,
        variants: {
          create: data.variants?.map((v: any) => ({
            name: v.name,
            type: v.type,
            stock: v.stock || 0,
          })) || [],
        },
      },
      include: { variants: true, category: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Gagal membuat produk" }, { status: 500 })
  }
}
