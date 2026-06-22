import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json()

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!voucher) {
      return NextResponse.json({ valid: false, error: "Voucher tidak ditemukan" })
    }

    if (!voucher.isActive) {
      return NextResponse.json({ valid: false, error: "Voucher sudah tidak aktif" })
    }

    const now = new Date()
    if (now < voucher.startDate || now > voucher.endDate) {
      return NextResponse.json({ valid: false, error: "Voucher sudah kadaluarsa" })
    }

    if (voucher.quota && voucher.usedCount >= voucher.quota) {
      return NextResponse.json({ valid: false, error: "Kuota voucher sudah habis" })
    }

    if (subtotal < voucher.minPurchase) {
      return NextResponse.json({
        valid: false,
        error: `Minimal belanja Rp ${voucher.minPurchase.toLocaleString("id-ID")}`,
      })
    }

    let discount = 0

    if (voucher.isShippingFree) {
      return NextResponse.json({
        valid: true,
        voucher,
        discount: 0,
        isShippingFree: true,
        message: "Gratis ongkos kirim!",
      })
    }

    if (voucher.discountPercent) {
      discount = Math.round((subtotal * voucher.discountPercent) / 100)
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount
      }
    } else if (voucher.discountAmount) {
      discount = voucher.discountAmount
    }

    return NextResponse.json({
      valid: true,
      voucher,
      discount,
      isShippingFree: false,
      message: `Diskon Rp ${discount.toLocaleString("id-ID")}`,
    })
  } catch (error) {
    console.error("Validate voucher error:", error)
    return NextResponse.json({ valid: false, error: "Terjadi kesalahan" }, { status: 500 })
  }
}
