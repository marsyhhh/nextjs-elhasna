import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  const password = await bcrypt.hash("admin123", 12)

  const superadmin = await prisma.user.upsert({
    where: { email: "superadmin@elhasna.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@elhasna.com",
      password,
      role: "SUPERADMIN",
      phone: "081234567890",
    },
  })
  console.log("Superadmin:", superadmin.email)

  const admin = await prisma.user.upsert({
    where: { email: "admin@elhasna.com" },
    update: {},
    create: {
      name: "Admin Toko",
      email: "admin@elhasna.com",
      password,
      role: "ADMIN",
      phone: "081234567891",
    },
  })
  console.log("Admin:", admin.email)

  const customer = await prisma.user.upsert({
    where: { email: "customer@elhasna.com" },
    update: {},
    create: {
      name: "Customer",
      email: "customer@elhasna.com",
      password,
      role: "CUSTOMER",
      phone: "081234567892",
    },
  })
  console.log("Customer:", customer.email)

  const categories = [
    { name: "Hijab", slug: "hijab", description: "Koleksi hijab modern", order: 1 },
    { name: "Gamis", slug: "gamis", description: "Gamis syar'i premium", order: 2 },
    { name: "Tunik", slug: "tunik", description: "Tunik casual modern", order: 3 },
    { name: "Mukena", slug: "mukena", description: "Mukena nyaman & elegan", order: 4 },
    { name: "Aksesoris", slug: "aksesoris", description: "Aksesoris pelengkap hijab", order: 5 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log("Kategori berhasil dibuat")

  await prisma.$disconnect()

  console.log("\n--- Akun Login ---")
  console.log("Superadmin: superadmin@elhasna.com / admin123")
  console.log("Admin:      admin@elhasna.com / admin123")
  console.log("Customer:   customer@elhasna.com / admin123")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
