"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { ShoppingBag, User, Search, Heart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCartStore } from "@/lib/store/cart-store"
import { useState } from "react"

export function Header() {
  const { data: session } = useSession()
  const { getTotalItems } = useCartStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const totalItems = getTotalItems()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm">
      <div className="bg-primary/5 text-xs text-center py-1.5 text-muted-foreground">
        <span className="animate-pulse">Gratis Ongkir X J&T dengan Voucher Khusus</span>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  Beranda
                </Link>
                <Link href="/products" className="text-lg" onClick={() => setMobileMenuOpen(false)}>
                  Katalog
                </Link>
                <Link href="/category/hijab" className="text-lg" onClick={() => setMobileMenuOpen(false)}>
                  Hijab
                </Link>
                <Link href="/category/gamis" className="text-lg" onClick={() => setMobileMenuOpen(false)}>
                  Gamis
                </Link>
                <Link href="/category/tunik" className="text-lg" onClick={() => setMobileMenuOpen(false)}>
                  Tunik
                </Link>
                <Link href="/category/mukena" className="text-lg" onClick={() => setMobileMenuOpen(false)}>
                  Mukena
                </Link>
                {session?.user && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/dashboard" className="text-lg" onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                    {session.user.role !== "CUSTOMER" && (
                      <Link href="/admin" className="text-lg" onClick={() => setMobileMenuOpen(false)}>
                        Admin Panel
                      </Link>
                    )}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-heading font-bold tracking-tight text-primary">
              Elhasna
            </span>
            <span className="text-xl font-heading font-light text-foreground">
              Hijab
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari gamis silk, hijab voal..."
                className="pl-9 h-9 bg-muted/50 border-none rounded-full text-sm"
              />
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2">
              Katalog
            </Link>
            <Link href="/category/hijab" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2">
              Hijab
            </Link>
            <Link href="/category/gamis" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2">
              Gamis
            </Link>
            <Link href="/category/tunik" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2">
              Tunik
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full outline-none inline-flex items-center justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name || "Pengguna"}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/dashboard" className="w-full">Dashboard Saya</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/dashboard/orders" className="w-full">Pesanan Saya</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/dashboard/profile" className="w-full">Profil Saya</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/dashboard/wishlist" className="w-full">Wishlist</Link>
                  </DropdownMenuItem>
                  {(session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link href="/admin" className="w-full">
                          Panel Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild className="text-sm">
                  <Link href="/auth/login">Masuk</Link>
                </Button>
                <Button size="sm" asChild className="text-sm bg-primary text-primary-foreground">
                  <Link href="/auth/register">Daftar</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
