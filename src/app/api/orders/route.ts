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
      user: { select: { name: true, email: true } },
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

    // Validate stock for each item
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { combinations: true },
      })

      if (!product) {
        return NextResponse.json({ error: `Produk tidak ditemukan: ${item.productId}` }, { status: 400 })
      }

      if (item.combinationId) {
        const combo = product.combinations?.find((c) => c.id === item.combinationId)
        if (!combo) {
          return NextResponse.json({ error: `Kombinasi varian tidak ditemukan` }, { status: 400 })
        }
        if (combo.stock < item.quantity) {
          return NextResponse.json({
            error: `Stok kombinasi untuk "${product.name}" tidak mencukupi. Tersedia: ${combo.stock}`,
          }, { status: 400 })
        }
      } else if (product.stock < item.quantity) {
        return NextResponse.json({
          error: `Stok "${product.name}" tidak mencukupi. Tersedia: ${product.stock}`,
        }, { status: 400 })
      }
    }

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
            combinationId: item.combinationId || null,
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

    if (data.voucherCode) {
      await prisma.voucher.update({
        where: { code: data.voucherCode },
        data: { usedCount: { increment: 1 } },
      })
    }

    await prisma.cartItem.deleteMany({
      where: { cart: { userId: session.user.id } },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 })
  }
}
