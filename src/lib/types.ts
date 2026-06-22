import type { $Enums } from "@/generated/prisma/client"

export type Role = $Enums.Role
export type OrderStatus = $Enums.OrderStatus
export type PaymentStatus = $Enums.PaymentStatus

declare module "next-auth" {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}
