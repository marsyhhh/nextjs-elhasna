import jsPDF from "jspdf"

interface LabelOrder {
  invoiceNumber: string
  biteshipWaybillId?: string | null
  courier?: string | null
  courierService?: string | null
  shippingCost: number
  user?: { name?: string | null; phone?: string | null }
  address?: {
    street?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
  }
  items?: Array<{
    product?: { name?: string | null }
    variant?: { name?: string | null } | null
    quantity: number
    price: number
  }>
}

export function generateShippingLabel(order: LabelOrder) {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("ELHASNA HIJAB", pageWidth / 2, y, { align: "center" })
  y += 6

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Resi Pengiriman", pageWidth / 2, y, { align: "center" })
  y += 8

  doc.setDrawColor(0)
  doc.line(15, y, pageWidth - 15, y)
  y += 8

  const bold = (label: string, value: string, x: number) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, x, y)
    doc.setFont("helvetica", "normal")
    doc.text(value, x + 50, y)
    y += 6
  }

  bold("No. Invoice", `: ${order.invoiceNumber || "-"}`, 15)
  if (order.biteshipWaybillId) {
    bold("No. Resi", `: ${order.biteshipWaybillId}`, 15)
  }

  const courierName = order.courier?.toUpperCase() || "-"
  const serviceName = order.courierService?.toUpperCase() || ""
  bold("Kurir", `: ${courierName} ${serviceName}`.trim(), 15)

  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  bold("Tanggal", `: ${today}`, 15)

  y += 4
  doc.line(15, y, pageWidth - 15, y)
  y += 8

  doc.setFont("helvetica", "bold")
  doc.text("ALAMAT ASAL", 15, y)
  y += 6
  doc.setFont("helvetica", "normal")
  doc.text("Elhasna Hijab", 15, y)
  y += 5
  doc.text("Ciwidey, Bandung, Jawa Barat 40396", 15, y)
  y += 5
  doc.text("08123456789", 15, y)
  y += 10

  doc.setFont("helvetica", "bold")
  doc.text("ALAMAT TUJUAN", 15, y)
  y += 6
  doc.setFont("helvetica", "normal")

  if (order.address) {
    const addrParts = [
      order.address.street,
      order.address.city,
      order.address.province,
    ].filter(Boolean)
    doc.text(addrParts.join(", "), 15, y)
    y += 5
    if (order.address.postalCode) {
      doc.text(`Kode Pos: ${order.address.postalCode}`, 15, y)
      y += 5
    }
  }

  if (order.user) {
    const contact: string[] = []
    if (order.user.name) contact.push(order.user.name)
    if (order.user.phone) contact.push(order.user.phone)
    if (contact.length) {
      doc.text(contact.join(" - "), 15, y)
      y += 5
    }
  }

  y += 4
  doc.line(15, y, pageWidth - 15, y)
  y += 8

  if (order.items && order.items.length > 0) {
    doc.setFont("helvetica", "bold")
    doc.text("ITEM PESANAN", 15, y)
    y += 6
    doc.setFont("helvetica", "normal")

    for (const item of order.items) {
      const name = item.product?.name || "Produk"
      const variant = item.variant?.name ? ` (${item.variant.name})` : ""
      const line = `${item.quantity}x ${name}${variant} @ Rp${item.price.toLocaleString("id-ID")}`
      doc.text(line, 20, y)
      y += 5
    }
  }

  y += 4
  doc.line(15, y, pageWidth - 15, y)
  y += 8

  doc.setFont("helvetica", "bold")
  doc.text(`Total Ongkos Kirim: Rp${order.shippingCost.toLocaleString("id-ID")}`, 15, y)
  y += 12

  if (order.biteshipWaybillId) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("Link Tracking: https://track.biteship.com/", 15, y)
    y += 4
    doc.text(order.biteshipWaybillId, 15, y)
  }

  doc.save(`resi-${order.invoiceNumber || "pengiriman"}.pdf`)
}
