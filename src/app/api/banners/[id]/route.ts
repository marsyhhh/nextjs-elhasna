import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await req.json()
    const updateData: Record<string, unknown> = {}

    if (data.title) updateData.title = data.title
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle || null
    if (data.image) updateData.image = data.image
    if (data.link !== undefined) updateData.link = data.link || null
    if (data.order !== undefined) updateData.order = data.order
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.type !== undefined) updateData.type = data.type

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error("Update banner error:", error)
    return NextResponse.json({ error: "Gagal mengupdate banner" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.banner.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete banner error:", error)
    return NextResponse.json({ error: "Gagal menghapus banner" }, { status: 500 })
  }
}
