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

  // Restore stock if order was already paid (PROCESSING status)
  if (order.status === "PROCESSING") {
    for (const item of updated.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          soldCount: { decrement: item.quantity },
        },
      })

      if (item.combinationId) {
        await prisma.productVariantCombination.update({
          where: { id: item.combinationId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }
  }

  return NextResponse.json(updated)
}
