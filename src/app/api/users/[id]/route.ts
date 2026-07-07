import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "PEMILIK")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    if (session.user.id === id) {
      return NextResponse.json({ error: "Tidak bisa mengubah akun sendiri" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true } })
    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    const data = await req.json()

    const updateData: any = {}

    if (session.user.role === "PEMILIK") {
      if (targetUser.role === "CUSTOMER") {
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.role) return NextResponse.json({ error: "Tidak bisa mengubah role pelanggan" }, { status: 403 })
      } else if (targetUser.role === "ADMIN") {
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.role) return NextResponse.json({ error: "Tidak bisa mengubah role admin" }, { status: 403 })
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.role) updateData.role = data.role
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Gagal mengupdate user" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "PEMILIK")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    if (session.user.id === id) {
      return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 })
    }

    if (session.user.role === "PEMILIK") {
      const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } })
      if (!targetUser) {
        return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
      }
      if (targetUser.role !== "ADMIN") {
        return NextResponse.json({ error: "Hanya bisa menghapus admin" }, { status: 403 })
      }
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 })
  }
}
