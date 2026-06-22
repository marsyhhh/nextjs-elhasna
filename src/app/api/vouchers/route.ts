import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(vouchers)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const voucher = await prisma.voucher.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discountPercent: data.discountPercent || null,
        discountAmount: data.discountAmount || null,
        minPurchase: data.minPurchase || 0,
        maxDiscount: data.maxDiscount || null,
        quota: data.quota || null,
        isShippingFree: data.isShippingFree || false,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    })

    return NextResponse.json(voucher, { status: 201 })
  } catch (error) {
    console.error("Create voucher error:", error)
    return NextResponse.json({ error: "Gagal membuat voucher" }, { status: 500 })
  }
}
