import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    const where = type ? { type: type as "HERO" | "PROMO" } : {}

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { order: "asc" },
    })
    return NextResponse.json(banners)
  } catch {
    return NextResponse.json({ error: "Gagal memuat banner" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        image: data.image,
        link: data.link || null,
        order: data.order ?? 0,
        isActive: data.isActive ?? true,
        type: data.type ?? "HERO",
      },
    })
    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    console.error("Create banner error:", error)
    return NextResponse.json({ error: "Gagal membuat banner" }, { status: 500 })
  }
}
