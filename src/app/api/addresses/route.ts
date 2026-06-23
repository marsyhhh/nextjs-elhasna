import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "desc" }],
  })

  return NextResponse.json(addresses)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        label: data.label || "Utama",
        recipient: data.recipient,
        phone: data.phone,
        street: data.street,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        areaId: data.areaId || null,
        isDefault: data.isDefault || false,
      },
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    console.error("Create address error:", error)
    const message = error instanceof Error ? error.message : "Gagal menyimpan alamat"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
