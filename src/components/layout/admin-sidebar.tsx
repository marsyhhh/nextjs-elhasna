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
  Image,
  LogOut,
  ChevronDown,
} from "lucide-react"

const navItems = [
  {
    group: "Utama",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Manajemen Produk",
    items: [
      { href: "/admin/products", label: "Daftar Produk", icon: ShoppingBag },
      { href: "/admin/categories", label: "Kategori", icon: Layers },
    ],
  },
  {
    group: "Manajemen Penjualan",
    items: [
      { href: "/admin/orders", label: "Pesanan Masuk", icon: Package },
    ],
  },
  {
    group: "Manajemen Promo",
    items: [
      { href: "/admin/vouchers", label: "Voucher & Diskon", icon: Percent },
    ],
  },
]

const superadminItems = [
  {
    group: "Superadmin",
    items: [
      { href: "/admin/analytics", label: "Laporan Keuangan", icon: BarChart3 },
      { href: "/admin/content", label: "Konten Halaman", icon: Image },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isSuperadmin = session?.user?.role === "SUPERADMIN"
  const isAdmin = session?.user?.role === "ADMIN" || isSuperadmin

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-white">
            EH
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Elhasna Hijab</p>
            <p className="text-[10px] text-slate-400">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navItems.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-primary/20 text-primary font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {isSuperadmin && (
          <div className="pt-4 border-t border-slate-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/70 px-3 mb-2">
              Superadmin
            </p>
            <ul className="space-y-0.5">
              {superadminItems[0].items.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-amber-500/20 text-amber-400 font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
            {session?.user?.name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name || "Admin"}</p>
            <p className="text-[10px] text-slate-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Kembali ke Toko
        </Link>
      </div>
    </aside>
  )
}
