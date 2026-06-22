import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

    if (data.code) updateData.code = data.code.toUpperCase()
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.discountPercent !== undefined) updateData.discountPercent = data.discountPercent || null
    if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount || null
    if (data.minPurchase !== undefined) updateData.minPurchase = data.minPurchase
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount || null
    if (data.quota !== undefined) updateData.quota = data.quota || null
    if (data.isShippingFree !== undefined) updateData.isShippingFree = data.isShippingFree
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    const voucher = await prisma.voucher.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(voucher)
  } catch (error) {
    console.error("Update voucher error:", error)
    return NextResponse.json({ error: "Gagal mengupdate voucher" }, { status: 500 })
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
    await prisma.voucher.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete voucher error:", error)
    return NextResponse.json({ error: "Gagal menghapus voucher" }, { status: 500 })
  }
}
