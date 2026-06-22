"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

const gradients = [
  "from-primary/10 via-primary/5 to-background",
  "from-accent via-accent/5 to-background",
  "from-secondary/20 via-secondary/5 to-background",
  "from-emerald-500/10 via-emerald-500/5 to-background",
  "from-violet-500/10 via-violet-500/5 to-background",
]

export function HeroSection() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch("/api/banners")
        const data = await res.json()
        const active = Array.isArray(data) ? data.filter((b: any) => b.isActive) : []
        setBanners(active)
      } catch {
        setBanners([])
      }
      setLoading(false)
    }
    fetchBanners()
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 lg:py-32 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    )
  }

  if (banners.length === 0) return null

  const banner = banners[current]

  return (
    <section className="relative overflow-hidden bg-background">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradients[current % gradients.length]} transition-all duration-700`} />

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            {banner.subtitle && (
              <p className="text-sm font-medium text-primary/70 uppercase tracking-widest">
                {banner.subtitle}
              </p>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight">
              {banner.title}
            </h1>
            <Button size="lg" asChild className="rounded-full">
              <Link href={banner.link || "/products"}>
                {banner.link ? "Lihat Detail" : "Belanja Sekarang"}
              </Link>
            </Button>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="relative w-80 h-96 rounded-2xl overflow-hidden shadow-xl bg-muted">
              {banner.image ? (
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 0vw, 320px"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">No Image</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {banners.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </section>
  )
}
