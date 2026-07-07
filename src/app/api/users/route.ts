import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "PEMILIK")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")

    const where: any = {}

    if (session.user.role === "PEMILIK") {
      if (role === "customer") where.role = "CUSTOMER"
      else if (role === "admin") where.role = "ADMIN"
      else return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    } else {
      if (role === "customer") where.role = "CUSTOMER"
      else if (role === "admin") where.role = "ADMIN"
      else if (role === "owner") where.role = "PEMILIK"
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Gagal memuat user" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "PEMILIK")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const role = session.user.role === "PEMILIK" ? "ADMIN" : (data.role || "ADMIN")
    if (role !== "ADMIN" && role !== "PEMILIK") {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 })
  }
}
