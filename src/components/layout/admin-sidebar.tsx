"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Percent,
  Layers,
  BarChart3,
  ImageIcon,
  LogOut,
  X,
  Menu,
  ChevronDown,
} from "lucide-react"
import { useEffect, useState } from "react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: ShoppingBag },
  { href: "/admin/orders", label: "Pesanan", icon: Package },
  { href: "/admin/categories", label: "Kategori", icon: Layers },
  { href: "/admin/vouchers", label: "Voucher", icon: Percent },
  { href: "/admin/banners", label: "Banner", icon: ImageIcon, dropdown: true,
    children: [
      { href: "/admin/banners", label: "Hero" },
      { href: "/admin/banners/promo", label: "Promo" },
    ],
  },
  { href: "/admin/analytics", label: "Laporan", icon: BarChart3 },
]

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isSuperadmin = session?.user?.role === "SUPERADMIN"
  const isAdmin = session?.user?.role === "ADMIN" || isSuperadmin
  const isBannerActive = pathname === "/admin/banners" || pathname.startsWith("/admin/banners/")
  const [bannerOpen, setBannerOpen] = useState(isBannerActive)

  useEffect(() => {
    onClose()
  }, [pathname])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  useEffect(() => {
    if (isBannerActive) setBannerOpen(true)
  }, [pathname])

  if (!isAdmin) return null

  const visibleItems = navItems.filter(
    (item) => isSuperadmin || (item.href !== "/admin/analytics" && item.href !== "/admin/banners")
  )

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            EH
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Elhasna Hijab</p>
            <p className="text-[10px] text-slate-400">Admin Panel</p>
          </div>
        </Link>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon

          if (item.dropdown) {
            return (
              <div key={item.href} className="space-y-1">
                <button
                  onClick={() => setBannerOpen(!bannerOpen)}
                  className={cn(
                    "flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isBannerActive
                      ? "bg-primary/20 text-primary font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", bannerOpen && "rotate-180")} />
                </button>
                {bannerOpen && (
                  <div className="ml-6 space-y-1 border-l border-slate-700 pl-3">
                    {item.children?.map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isChildActive
                              ? "bg-primary/20 text-primary font-medium"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          )}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white shrink-0">
            {session?.user?.name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name || "Admin"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {isSuperadmin ? "Superadmin" : "Admin"}
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Kembali ke Toko
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar (fixed) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 text-white">
        {sidebarContent}
      </aside>
    </>
  )
}

export function AdminSidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
