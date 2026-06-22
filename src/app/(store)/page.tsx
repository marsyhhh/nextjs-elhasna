import { HeroSection } from "@/components/home/hero-section"
import { CategoryBar } from "@/components/home/category-bar"
import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timer } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 20,
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
  const [products, flashProducts] = await Promise.all([
    getFeaturedProducts(),
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
            {products.slice(0, 10).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                discountPrice={product.discountPrice}
                image={product.images[0] || ""}
                variants={product.variants}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                Banner Promo
              </div>
            </div>
            <div className="space-y-4">
              <Badge variant="secondary">Best Seller</Badge>
              <h2 className="text-3xl font-heading font-bold">Koleksi Gamis Premium</h2>
              <p className="text-muted-foreground leading-relaxed">
                Temukan gamis favoritmu dengan bahan berkualitas tinggi dan desain modern yang cocok untuk berbagai acara.
              </p>
              <Button asChild>
                <Link href="/category/gamis">Explore Koleksi</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold">Produk Terbaru</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.slice(10, 20).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                discountPrice={product.discountPrice}
                image={product.images[0] || ""}
                variants={product.variants}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
