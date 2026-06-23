import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTracking, mapBiteshipStatus } from "@/lib/biteship"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ waybill_id: string }> }) {
  try {
    const { waybill_id } = await params

    if (!waybill_id) {
      return NextResponse.json({ error: "waybill_id required" }, { status: 400 })
    }

    const existingOrder = await prisma.order.findFirst({
      where: { biteshipWaybillId: waybill_id },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const trackingId = existingOrder.biteshipTrackingId || waybill_id
    const trackingData = await getTracking(trackingId)

    const status = trackingData?.status || trackingData?.courier_status
    const orderStatus = mapBiteshipStatus(status)

    const updateData: any = {
      biteshipStatus: status,
      biteshipTrackingUrl: trackingData?.tracking_url || trackingData?.link || null,
    }

    if (orderStatus) {
      updateData.status = orderStatus
      if (orderStatus === "SHIPPED" && !existingOrder.shippedAt) {
        updateData.shippedAt = new Date()
      }
      if (orderStatus === "DELIVERED") {
        updateData.deliveredAt = new Date()
      }
    }

    await prisma.order.update({
      where: { id: existingOrder.id },
      data: updateData,
    })

    const updatedOrder = await prisma.order.findFirst({
      where: { biteshipWaybillId: waybill_id },
    })

    return NextResponse.json({
      success: true,
      tracking: trackingData,
      order: updatedOrder
        ? {
            status: updatedOrder.status,
            biteshipStatus: updatedOrder.biteshipStatus,
            biteshipTrackingUrl: updatedOrder.biteshipTrackingUrl,
            biteshipLabelUrl: updatedOrder.biteshipLabelUrl,
            shippedAt: updatedOrder.shippedAt,
            deliveredAt: updatedOrder.deliveredAt,
          }
        : null,
    })
  } catch (error: any) {
    console.error("Biteship tracking error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
