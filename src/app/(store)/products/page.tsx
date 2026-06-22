import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"
import { ProductFilter } from "@/components/product/product-filter"

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams
  const category = params.category
  const search = params.search
  const sort = params.sort
  const flashSale = params.flash_sale

  const where: any = { isActive: true }

  if (category) {
    where.category = { slug: category }
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }
  if (flashSale === "true") {
    where.isFlashSale = true
  }

  let orderBy: any = { createdAt: "desc" }
  if (sort === "price_asc") orderBy = { price: "asc" }
  else if (sort === "price_desc") orderBy = { price: "desc" }
  else if (sort === "created_at_asc") orderBy = { createdAt: "asc" }
  else if (sort === "name") orderBy = { name: "asc" }

  const products = await prisma.product.findMany({
    where,
    include: { variants: true, category: true },
    orderBy,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">
          {flashSale ? "Flash Sale" : category ? `Kategori ${category}` : "Semua Produk"}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{products.length} produk</span>
        </div>
      </div>

      <Suspense fallback={<div className="h-9 mb-6" />}>
        <ProductFilter />
      </Suspense>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            price={product.price}
            discountPrice={product.discountPrice}
            image={product.images[0] || ""}
            variants={product.variants}
            isFlashSale={product.isFlashSale}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
        </div>
      )}
    </div>
  )
}
