import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/product/product-card"

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const category = await prisma.category.findUnique({ where: { slug } })
  if (!category) notFound()

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, isActive: true },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">{category.name}</h1>
        {category.description && <p className="text-muted-foreground mt-1">{category.description}</p>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug}
            price={product.price} discountPrice={product.discountPrice} image={product.images[0] || ""}
            soldCount={product.soldCount} stock={product.stock}
            variants={product.variants} />
        ))}
      </div>
      {products.length === 0 && <div className="text-center py-20"><p className="text-muted-foreground">Belum ada produk di kategori ini</p></div>}
    </div>
  )
}
