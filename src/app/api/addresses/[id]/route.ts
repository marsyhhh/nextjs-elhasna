import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await req.json()

    const existing = await prisma.address.findUnique({
      where: { id },
    })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 })
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        label: data.label ?? existing.label,
        recipient: data.recipient ?? existing.recipient,
        phone: data.phone ?? existing.phone,
        street: data.street ?? existing.street,
        city: data.city ?? existing.city,
        cityId: data.cityId !== undefined ? (data.cityId || null) : existing.cityId,
        province: data.province ?? existing.province,
        provinceId: data.provinceId !== undefined ? (data.provinceId || null) : existing.provinceId,
        postalCode: data.postalCode ?? existing.postalCode,
        isDefault: data.isDefault ?? existing.isDefault,
      },
    })

    return NextResponse.json(address)
  } catch (error) {
    console.error("Update address error:", error)
    return NextResponse.json({ error: "Gagal mengupdate alamat" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    const existing = await prisma.address.findUnique({
      where: { id },
    })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 })
    }

    const orderCount = await prisma.order.count({
      where: { addressId: id },
    })
    if (orderCount > 0) {
      return NextResponse.json(
        { error: `Alamat ini memiliki ${orderCount} pesanan terkait dan tidak dapat dihapus.` },
        { status: 400 }
      )
    }

    await prisma.address.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete address error:", error)
    return NextResponse.json({ error: "Gagal menghapus alamat" }, { status: 500 })
  }
}
