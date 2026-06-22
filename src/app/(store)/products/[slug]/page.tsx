import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/product/product-detail"

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const product = await prisma.product.findFirst({
    where: { OR: [{ slug }, { id: slug }], isActive: true },
    include: { variants: true, category: true, reviews: { include: { user: true }, orderBy: { createdAt: "desc" } } },
  })

  if (!product) notFound()

  return <ProductDetail product={product} />
}
