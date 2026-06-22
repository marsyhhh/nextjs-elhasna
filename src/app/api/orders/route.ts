import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateInvoiceNumber } from "@/lib/utils"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  const where: any = {}

  if (session.user.role === "CUSTOMER") {
    where.userId = session.user.id
  }

  if (status) {
    where.status = status
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: true, variant: true } },
      address: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const invoiceNumber = generateInvoiceNumber()

    const order = await prisma.order.create({
      data: {
        invoiceNumber,
        userId: session.user.id,
        addressId: data.addressId,
        subtotal: data.subtotal,
        shippingCost: data.shippingCost || 0,
        discount: data.discount || 0,
        voucherCode: data.voucherCode || null,
        total: data.total,
        notes: data.notes || null,
        courier: data.courier,
        courierService: data.courierService,
        estimatedDays: data.estimatedDays,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    })

    await prisma.cartItem.deleteMany({
      where: { cart: { userId: session.user.id } },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 })
  }
}
