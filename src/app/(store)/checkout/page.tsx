"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCartStore } from "@/lib/store/cart-store"
import VoucherInput from "@/components/checkout/voucher-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import { MapPin, Package, Truck } from "lucide-react"
import Link from "next/link"

interface ShippingOption {
  service: string
  description: string
  cost: number
  etd: string
  courier: string
  courierName: string
}

const couriers = [
  { value: "jne", label: "JNE" },
  { value: "jnt", label: "J&T" },
  { value: "sicepat", label: "SiCepat" },
  { value: "anteraja", label: "AnterAja" },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, getSubtotal, clearCart, voucher, removeVoucher } = useCartStore()

  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [courier, setCourier] = useState("jne")
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<string>("")
  const [shippingCost, setShippingCost] = useState(0)
  const [estimatedDays, setEstimatedDays] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingShipping, setLoadingShipping] = useState(false)

  const subtotal = getSubtotal()
  const discount = voucher?.discount ?? 0
  const effectiveShipping = voucher?.isShippingFree ? 0 : shippingCost
  const total = subtotal - discount + effectiveShipping

  useEffect(() => {
    if (!session) {
      router.push("/auth/login?callbackUrl=/checkout")
      return
    }
    if (items.length === 0) {
      router.push("/cart")
      return
    }
    fetchAddresses()
  }, [session, items])

  useEffect(() => {
    if (selectedAddress) {
      loadShippingCost()
    }
  }, [selectedAddress, courier])

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/addresses")
      const data = await res.json()
      setAddresses(data)
      if (data.length > 0) setSelectedAddress(data[0].id)
    } catch {
      toast.error("Gagal memuat alamat")
    }
  }

  async function loadShippingCost() {
    const address = addresses.find((a) => a.id === selectedAddress)
    if (!address) return

    if (!address.postalCode) {
      toast.error("Alamat belum memiliki kode pos. Perbarui alamat di dashboard.")
      return
    }

    setLoadingShipping(true)
    setShippingOptions([])
    setSelectedShipping("")
    setShippingCost(0)

    const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0)

    try {
      const res = await fetch("/api/biteship/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationPostalCode: address.postalCode,
          couriers: courier,
          items: items.map((item) => ({
            name: item.name,
            value: item.discountPrice || item.price,
            weight: item.weight,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Gagal menghitung ongkir")
        setLoadingShipping(false)
        return
      }

      if (data.pricing && data.pricing.length > 0) {
        const options: ShippingOption[] = data.pricing.map((p: any) => ({
          service: p.courier_service_code,
          description: p.courier_service_name,
          cost: p.price,
          etd: p.shipment_duration_range || p.duration?.replace(" days", "").trim() || "",
          courier: p.company,
          courierName: p.courier_name,
        }))
        setShippingOptions(options)
      } else {
        toast.error("Tidak ada layanan pengiriman tersedia")
      }
    } catch {
      toast.error("Gagal menghitung ongkir")
    }
    setLoadingShipping(false)
  }

  function handleShippingSelect(service: string, cost: number, etd: string) {
    setSelectedShipping(service)
    setShippingCost(cost)
    setEstimatedDays(etd)
  }

  async function handleCheckout() {
    if (!selectedAddress) {
      toast.error("Pilih alamat pengiriman")
      return
    }
    if (!selectedShipping) {
      toast.error("Pilih layanan pengiriman")
      return
    }

    let freshDiscount = discount
    let freshShippingFree = voucher?.isShippingFree ?? false

    if (voucher) {
      const validateRes = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucher.code, subtotal }),
      })

      const validateData = await validateRes.json()
      if (!validateData.valid) {
        removeVoucher()
        toast.error(validateData.error)
        return
      }

      freshDiscount = validateData.discount
      freshShippingFree = validateData.isShippingFree
    }

    setLoading(true)

    const finalShipping = freshShippingFree ? 0 : shippingCost
    const finalTotal = subtotal - freshDiscount + finalShipping

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress,
          subtotal,
          shippingCost: finalShipping,
          discount: freshDiscount,
          total: finalTotal,
          voucherCode: voucher?.code || null,
          notes,
          courier,
          courierService: selectedShipping,
          estimatedDays,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            combinationId: item.combinationId,
            quantity: item.quantity,
            price: item.discountPrice || item.price,
          })),
        }),
      })

      if (!res.ok) throw new Error()

      const order = await res.json()

      const midtransRes = await fetch("/api/midtrans/snap-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })

      const midtransData = await midtransRes.json()

      if (midtransData.token) {
        clearCart()
        window.location.assign(midtransData.redirectUrl)
      }
    } catch {
      toast.error("Gagal memproses pesanan")
    }
    setLoading(false)
  }

  if (items.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-heading font-bold mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Alamat Pengiriman</h3>
              </div>

              {addresses.length > 0 ? (
                <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                  {addresses.map((addr) => (
                    <div key={addr.id} className="flex items-start gap-3 p-3 rounded-lg border has-[[data-state=checked]]:border-primary">
                      <RadioGroupItem value={addr.id} id={addr.id} />
                      <Label htmlFor={addr.id} className="flex-1 cursor-pointer">
                        <p className="font-medium text-sm">{addr.recipient} - {addr.phone}</p>
                        <p className="text-xs text-muted-foreground mt-1">{addr.street}, {addr.city}, {addr.province} {addr.postalCode}</p>
                        <p className="text-xs text-muted-foreground">{addr.label}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">Belum ada alamat tersimpan</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/addresses">Tambah Alamat</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Pengiriman</h3>
              </div>

              <div className="space-y-4">
                <RadioGroup value={courier} onValueChange={setCourier}>
                  <div className="grid grid-cols-2 gap-3">
                    {couriers.map((c) => (
                      <div key={c.value} className="flex items-center gap-2 p-3 rounded-lg border has-[[data-state=checked]]:border-primary">
                        <RadioGroupItem value={c.value} id={`courier-${c.value}`} />
                        <Label htmlFor={`courier-${c.value}`} className="cursor-pointer text-sm">{c.label}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {loadingShipping && <p className="text-sm text-muted-foreground">Menghitung ongkir...</p>}

                {shippingOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Pilih Layanan</Label>
                    {shippingOptions.map((opt) => (
                      <div
                        key={`${opt.courier}-${opt.service}`}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                          selectedShipping === opt.service ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => handleShippingSelect(opt.service, opt.cost, opt.etd)}
                      >
                        <div>
                          <p className="text-sm font-medium">{opt.courierName} - {opt.service}</p>
                          <p className="text-xs text-muted-foreground">{opt.description} ({opt.etd} hari)</p>
                        </div>
                        <p className="font-semibold text-sm">{formatPrice(opt.cost)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Catatan</h3>
              </div>
              <Textarea
                placeholder="Catatan untuk penjual (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <VoucherInput />
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Ringkasan Pesanan</h3>
              <Separator />

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded bg-muted shrink-0 overflow-hidden">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      <p className="text-xs font-semibold">{formatPrice((item.discountPrice || item.price) * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon {voucher?.code}</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ongkos Kirim</span>
                  <span>
                    {voucher?.isShippingFree
                      ? "Gratis"
                      : shippingCost > 0
                      ? formatPrice(shippingCost)
                      : "-"}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <Button
                className="w-full rounded-full"
                size="lg"
                onClick={handleCheckout}
                disabled={loading || !selectedAddress || !selectedShipping}
              >
                {loading ? "Memproses..." : "Bayar Sekarang"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
