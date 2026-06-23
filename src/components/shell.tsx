"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const isAuth = pathname.startsWith("/auth")
  const hideNav = isAdmin || isAuth

  return (
    <>
      {!hideNav && <Header />}
      <main className="flex-1">{children}</main>
      {!hideNav && <Footer />}
    </>
  )
}
