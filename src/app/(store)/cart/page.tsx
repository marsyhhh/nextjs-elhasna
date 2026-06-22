"use client"

import Link from "next/link"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Trash2, ShoppingBag, ArrowLeft, Minus, Plus } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore()

  const subtotal = getSubtotal()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/40" />
          <h2 className="text-xl font-semibold">Keranjang Belanja Kosong</h2>
          <p className="text-muted-foreground">Yuk, mulai belanja kebutuhan fashion muslim Anda</p>
          <Button asChild>
            <Link href="/products">Mulai Belanja</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Keranjang Belanja</h1>
        <span className="text-sm text-muted-foreground">{items.length} item</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border">
              <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="text-sm font-medium hover:underline line-clamp-1">
                  {item.name}
                </Link>
                {item.variantName && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>
                )}
                <p className="font-semibold text-sm mt-1">
                  {formatPrice(item.discountPrice || item.price)}
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-10 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-sm">
                  {formatPrice((item.discountPrice || item.price) * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-6 space-y-4 sticky top-24">
            <h3 className="font-semibold">Ringkasan Belanja</h3>
            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span className="font-medium">Dihitung saat checkout</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <Button className="w-full rounded-full" size="lg" asChild>
              <Link href="/checkout">Checkout</Link>
            </Button>

            <Button variant="ghost" className="w-full gap-2" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4" />
                Lanjut Belanja
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
