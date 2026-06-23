import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orderId } = await req.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (session.user.role === "CUSTOMER" && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!order.midtransOrderId) {
      return NextResponse.json({ error: "No Midtrans transaction found" }, { status: 400 })
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true"
    const baseUrl = isProduction
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2"
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ""

    const encodedOrderId = encodeURIComponent(encodeURIComponent(order.midtransOrderId))
    const url = `${baseUrl}/${encodedOrderId}/status`

    console.log("[MidtransStatus] checking:", url)

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    })

    const data = await res.json()
    console.log("[MidtransStatus] response:", JSON.stringify(data, null, 2))

    const { transaction_status, payment_type } = data
    console.log("[MidtransStatus] transaction_status:", transaction_status, "| payment_type:", payment_type)

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

    return NextResponse.json({
      paymentStatus,
      status: orderStatus,
      transactionStatus: transaction_status,
    })
  } catch (error: any) {
    console.error("[MidtransStatus] ERROR:", error?.message || error)
    return NextResponse.json({
      error: "Gagal mengecek status pembayaran",
      detail: error?.message || String(error),
    }, { status: 500 })
  }
}
