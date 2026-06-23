import { HeroSection } from "@/components/home/hero-section"
import { PromoBanner } from "@/components/home/promo-banner"
import { CategoryBar } from "@/components/home/category-bar"
import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timer } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

async function getRecommendedProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: { variants: true },
      orderBy: { soldCount: "desc" },
      take: 10,
    })
  } catch {
    return []
  }
}

async function getNewestProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
  } catch {
    return []
  }
}

async function getFlashSaleProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true, isFlashSale: true },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [recommended, newest, flashProducts] = await Promise.all([
    getRecommendedProducts(),
    getNewestProducts(),
    getFlashSaleProducts(),
  ])

  return (
    <>
      <HeroSection />
      <CategoryBar />

      {flashProducts.length > 0 && (
        <section className="bg-gradient-to-r from-destructive/5 via-background to-destructive/5 py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-heading font-bold">Flash Sale</h2>
                <Badge variant="destructive" className="gap-1">
                  <Timer className="h-3 w-3" />
                  <span>12:45:30</span>
                </Badge>
              </div>
              <Button variant="link" asChild>
                <Link href="/products?flash_sale=true">Lihat Semua</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {flashProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  discountPrice={product.discountPrice}
                  image={product.images[0] || ""}
                  soldCount={product.soldCount}
                  stock={product.stock}
                  variants={product.variants}
                  isFlashSale
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold">Koleksi Rekomendasi</h2>
            <Button variant="link" asChild>
              <Link href="/products">Lihat Semua</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommended.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                discountPrice={product.discountPrice}
                image={product.images[0] || ""}
                soldCount={product.soldCount}
                stock={product.stock}
                variants={product.variants}
              />
            ))}
          </div>
        </div>
      </section>

      <PromoBanner />

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold">Produk Terbaru</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {newest.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                discountPrice={product.discountPrice}
                image={product.images[0] || ""}
                soldCount={product.soldCount}
                stock={product.stock}
                variants={product.variants}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
