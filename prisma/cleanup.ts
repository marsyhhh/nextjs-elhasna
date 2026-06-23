import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  console.log("Membersihkan data test...")

  await prisma.orderItem.deleteMany()
  console.log("  ✓ order_items dihapus")

  await prisma.order.deleteMany()
  console.log("  ✓ orders dihapus")

  await prisma.cartItem.deleteMany()
  console.log("  ✓ cart_items dihapus")

  await prisma.cart.deleteMany()
  console.log("  ✓ carts dihapus")

  await prisma.wishlistItem.deleteMany()
  console.log("  ✓ wishlist_items dihapus")

  await prisma.review.deleteMany()
  console.log("  ✓ reviews dihapus")

  await prisma.adminLog.deleteMany()
  console.log("  ✓ admin_logs dihapus")

  await prisma.session.deleteMany()
  console.log("  ✓ sessions dihapus")

  await prisma.account.deleteMany()
  console.log("  ✓ accounts dihapus")

  await prisma.verificationToken.deleteMany()
  console.log("  ✓ verification_tokens dihapus")

  await prisma.productVariantCombination.deleteMany()
  console.log("  ✓ product_variant_combinations dihapus")

  await prisma.productVariant.deleteMany()
  console.log("  ✓ product_variants dihapus")

  await prisma.product.deleteMany()
  console.log("  ✓ products dihapus")

  console.log("\nData test berhasil dibersihkan!")
  console.log("Data yang dipertahankan: users, categories, vouchers, banners, home_sections")

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
