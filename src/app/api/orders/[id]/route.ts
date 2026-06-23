import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, variant: true } },
      address: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
  }

  if (session.user.role === "CUSTOMER" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(order)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await req.json()
    const updateData: any = {}

    if (data.status) updateData.status = data.status
    if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus
    if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber
    if (data.courier) updateData.courier = data.courier
    if (data.biteshipWaybillId) updateData.biteshipWaybillId = data.biteshipWaybillId
    if (data.biteshipTrackingId) updateData.biteshipTrackingId = data.biteshipTrackingId
    if (data.biteshipStatus) updateData.biteshipStatus = data.biteshipStatus
    if (data.biteshipLabelUrl) updateData.biteshipLabelUrl = data.biteshipLabelUrl
    if (data.biteshipTrackingUrl) updateData.biteshipTrackingUrl = data.biteshipTrackingUrl

    if (data.status === "SHIPPED") updateData.shippedAt = new Date()
    if (data.status === "DELIVERED") updateData.deliveredAt = new Date()

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        address: true,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "Gagal mengupdate pesanan" }, { status: 500 })
  }
}
