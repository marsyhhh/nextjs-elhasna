"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const banners = [
  {
    id: 1,
    title: "Koleksi Eid Series",
    subtitle: "Tampil Anggun di Hari Spesial",
    description: "Koleksi gamis dan tunik eksklusif dengan bahan premium untuk momen istimewa Anda.",
    cta: "Belanja Sekarang",
    link: "/category/gamis",
    bg: "from-primary/10 via-primary/5 to-background",
    accent: "bg-primary",
  },
  {
    id: 2,
    title: "Hijab Voal Premium",
    subtitle: "Nyaman Dipakai Seharian",
    description: "Temukan berbagai pilihan hijab voal dengan motif elegan dan warna pastel yang trendi.",
    cta: "Lihat Koleksi",
    link: "/category/hijab",
    bg: "from-accent via-accent/5 to-background",
    accent: "bg-accent",
  },
  {
    id: 3,
    title: "Flash Sale Akhir Bulan",
    subtitle: "Diskon Hingga 50%",
    description: "Jangan lewatkan promo spesial akhir bulan. Stok terbatas, grab it fast!",
    cta: "Belanja Sekarang",
    link: "/products?flash_sale=true",
    bg: "from-secondary/20 via-secondary/5 to-background",
    accent: "bg-secondary-foreground",
  },
]

export function HeroSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const banner = banners[current]

  return (
    <section className="relative overflow-hidden bg-background">
      <div className={`absolute inset-0 bg-gradient-to-r ${banner.bg} transition-all duration-700`} />

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium text-primary/70 uppercase tracking-widest">
              {banner.subtitle}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight">
              {banner.title}
            </h1>
            <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
              {banner.description}
            </p>
            <div className="flex gap-3">
              <Button size="lg" asChild className="rounded-full">
                <Link href={banner.link}>{banner.cta}</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="rounded-full">
                <Link href="/products">Lihat Semua</Link>
              </Button>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="relative w-80 h-96 bg-muted rounded-2xl overflow-hidden shadow-xl">
              <div className={`absolute inset-0 ${banner.accent} opacity-10`} />
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto rounded-full bg-muted-foreground/10 mb-4" />
                  <p className="text-muted-foreground text-sm">Visual Produk</p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
      </div>

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
    </section>
  )
}
