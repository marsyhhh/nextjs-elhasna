import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const order = await prisma.order.findUnique({ where: { id } })

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
  }

  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (order.status !== "PENDING_PAYMENT" && order.status !== "PROCESSING") {
    return NextResponse.json({ error: "Pesanan tidak dapat dibatalkan" }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "CANCELLED",
      paymentStatus: order.paymentStatus === "SUCCESS" ? "REFUNDED" : order.paymentStatus,
    },
    include: {
      items: { include: { product: true, variant: true } },
    },
  })

  return NextResponse.json(updated)
}
