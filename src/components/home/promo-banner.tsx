"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function PromoBanner() {
  const [banner, setBanner] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPromoBanner() {
      try {
        const res = await fetch("/api/banners?type=PROMO")
        const data = await res.json()
        const active = Array.isArray(data) ? data.filter((b: any) => b.isActive) : []
        setBanner(active.length > 0 ? active[0] : null)
      } catch {
        setBanner(null)
      }
      setLoading(false)
    }
    fetchPromoBanner()
  }, [])

  if (loading) return <section className="bg-muted/50 py-16"><div className="max-w-7xl mx-auto px-4" /></section>
  if (!banner) return null

  return (
    <section className="bg-muted/50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
            {banner.image ? (
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                Banner Promo
              </div>
            )}
          </div>
          <div className="space-y-4">
            <Badge variant="secondary">Promo</Badge>
            <h2 className="text-3xl font-heading font-bold">{banner.title}</h2>
            {banner.subtitle && (
              <p className="text-muted-foreground leading-relaxed">{banner.subtitle}</p>
            )}
            <Button asChild>
              <Link href={banner.link || "/products"}>Lihat Detail</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
