"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Heart } from "lucide-react"
import Link from "next/link"

export default function WishlistPage() {
  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Wishlist</h1>
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Wishlist masih kosong</p>
          <Link href="/products" className="text-sm text-primary hover:underline mt-2">Jelajahi Produk</Link>
        </CardContent>
      </Card>
    </div>
  )
}
