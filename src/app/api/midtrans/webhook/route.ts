import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { order_id, transaction_status, payment_type, fraud_status } = body

    if (!order_id) {
      return NextResponse.json({ error: "No order_id" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNumber: order_id },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    let paymentStatus = order.paymentStatus
    let orderStatus = order.status

    if (transaction_status === "capture" || transaction_status === "settlement") {
      paymentStatus = "SUCCESS"
      orderStatus = "PROCESSING"
    } else if (transaction_status === "pending") {
      paymentStatus = "PENDING"
      orderStatus = "PENDING_PAYMENT"
    } else if (transaction_status === "deny" || transaction_status === "cancel" || transaction_status === "expire") {
      paymentStatus = "FAILED"
      orderStatus = "CANCELLED"
    } else if (transaction_status === "refund" || transaction_status === "partial_refund") {
      paymentStatus = "REFUNDED"
    }

    const updateData: any = {
      paymentStatus,
      status: orderStatus,
      paymentMethod: payment_type || order.paymentMethod,
    }

    if (transaction_status === "capture" || transaction_status === "settlement") {
      updateData.paidAt = new Date()
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    })

    // Increment soldCount on successful payment (stock already held at order creation)
    if (transaction_status === "capture" || transaction_status === "settlement") {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      })

      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.quantity } },
        })
      }
    }

    // Restore stock on failed/expired payment
    if (transaction_status === "deny" || transaction_status === "cancel" || transaction_status === "expire") {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      })

      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })

        if (item.combinationId) {
          await prisma.productVariantCombination.update({
            where: { id: item.combinationId },
            data: { stock: { increment: item.quantity } },
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
