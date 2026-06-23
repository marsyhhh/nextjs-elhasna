"use client"

import { useState } from "react"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import { Percent, X } from "lucide-react"

export default function VoucherInput() {
  const { voucher, applyVoucher, removeVoucher, getSubtotal } = useCartStore()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleApply() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      toast.error("Masukkan kode voucher")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal: getSubtotal() }),
      })

      const data = await res.json()

      if (!data.valid) {
        toast.error(data.error)
        return
      }

      applyVoucher({
        code: data.voucher.code,
        discount: data.discount,
        isShippingFree: data.isShippingFree,
        voucherName: data.voucher.description || data.voucher.code,
      })

      toast.success(data.message || "Voucher berhasil diterapkan!")
      setCode("")
    } catch {
      toast.error("Gagal memvalidasi voucher")
    }
    setLoading(false)
  }

  if (voucher) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Voucher</h3>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50">
            <div>
              <p className="text-sm font-semibold text-green-700">{voucher.code}</p>
              <p className="text-xs text-green-600">
                {voucher.isShippingFree
                  ? "Gratis ongkos kirim"
                  : `Diskon ${formatPrice(voucher.discount)}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-700 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                removeVoucher()
                toast.success("Voucher dihapus")
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Voucher</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Masukkan kode voucher untuk mendapatkan diskon
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Masukkan kode voucher"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply()
            }}
            className="uppercase"
          />
          <Button onClick={handleApply} disabled={loading}>
            {loading ? "..." : "Pakai"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
