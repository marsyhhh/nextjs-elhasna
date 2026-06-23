import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapBiteshipStatus } from "@/lib/biteship"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { waybill_id, status, tracking_url, label_url, tracking_id } = body

    if (!waybill_id) {
      return NextResponse.json({ error: "waybill_id required" }, { status: 400 })
    }

    const orderStatus = mapBiteshipStatus(status)
    const updateData: any = {
      biteshipStatus: status,
      biteshipTrackingUrl: tracking_url || null,
      biteshipLabelUrl: label_url || null,
    }

    if (tracking_id) updateData.biteshipTrackingId = tracking_id

    if (orderStatus) {
      updateData.status = orderStatus
      if (orderStatus === "SHIPPED" && !updateData.shippedAt) {
        updateData.shippedAt = new Date()
      }
      if (orderStatus === "DELIVERED") {
        updateData.deliveredAt = new Date()
      }
    }

    const matchById = await prisma.order.count({
      where: { biteshipWaybillId: waybill_id },
    })

    if (matchById) {
      await prisma.order.updateMany({
        where: { biteshipWaybillId: waybill_id },
        data: updateData,
      })
    } else {
      await prisma.order.updateMany({
        where: { trackingNumber: waybill_id },
        data: updateData,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Biteship webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
