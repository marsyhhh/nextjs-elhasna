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
      include: { items: { include: { product: true } }, user: true },
    })

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
    }

    const Midtrans = require("midtrans-client")
    const snap = new Midtrans.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    })

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    const transactionDetails = {
      transaction_details: {
        order_id: order.invoiceNumber,
        gross_amount: order.total,
      },
      customer_details: {
        first_name: order.user.name || "Customer",
        email: order.user.email,
        phone: order.user.phone || "",
      },
      item_details: [
        ...order.items.map((item) => ({
          id: item.productId,
          price: item.price,
          quantity: item.quantity,
          name: item.product.name.substring(0, 50),
        })),
        ...(order.shippingCost > 0 ? [{
          id: "SHIPPING",
          price: order.shippingCost,
          quantity: 1,
          name: "Ongkos Kirim",
        }] : []),
      ],
      callbacks: {
        finish: `${baseUrl}/dashboard/orders/${order.id}`,
      },
    }

    const transaction = await snap.createTransaction(transactionDetails)

    await prisma.order.update({
      where: { id: orderId },
      data: {
        midtransOrderId: order.invoiceNumber,
        midtransToken: transaction.token,
      },
    })

    return NextResponse.json({
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    })
  } catch (error) {
    console.error("Midtrans error:", error)
    return NextResponse.json({ error: "Gagal memproses pembayaran" }, { status: 500 })
  }
}
