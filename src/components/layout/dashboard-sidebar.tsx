"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MapPin,
  User,
  Package,
  Percent,
  BarChart3,
  Settings,
  Image,
  Layers,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const customerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Pesanan Saya", icon: Package },
  { href: "/dashboard/profile", label: "Profil Saya", icon: User },
  { href: "/dashboard/addresses", label: "Alamat Saya", icon: MapPin },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
];

const adminLinks = [
  { href: "/admin", label: "Panel Admin", icon: Shield },
  { href: "/admin/products", label: "Produk", icon: ShoppingBag },
  { href: "/admin/orders", label: "Pesanan", icon: Package },
  { href: "/admin/vouchers", label: "Voucher", icon: Percent },
  { href: "/admin/categories", label: "Kategori", icon: Layers },
];

const superadminLinks = [
  { href: "/admin/analytics", label: "Laporan Keuangan", icon: BarChart3 },
  { href: "/admin/content", label: "Konten Halaman", icon: Image },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "CUSTOMER";

  const isAdminOrSuper = role === "ADMIN" || role === "SUPERADMIN";
  const isSuperadmin = role === "SUPERADMIN";

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white">
      <ScrollArea className="flex-1 py-4">
        <div className="px-3 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Umum
          </p>
        </div>
        <nav className="space-y-1 px-2">
          {customerLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Button
                key={link.href}
                variant="ghost"
                asChild
                className={cn(
                  "w-full justify-start gap-3 font-normal",
                  isActive && "bg-accent text-accent-foreground font-medium",
                )}
              >
                <Link href={link.href}>
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            );
          })}

          {/* {isAdminOrSuper && (
            <>
              <div className="px-3 pt-6 pb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin</p>
              </div>
              {adminLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
                return (
                  <Button
                    key={link.href}
                    variant="ghost"
                    asChild
                    className={cn(
                      "w-full justify-start gap-3 font-normal",
                      isActive && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <Link href={link.href}>
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                )
              })}
            </>
          )}

          {isSuperadmin && (
            <>
              <div className="px-3 pt-6 pb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Superadmin</p>
              </div>
              {superadminLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
                return (
                  <Button
                    key={link.href}
                    variant="ghost"
                    asChild
                    className={cn(
                      "w-full justify-start gap-3 font-normal",
                      isActive && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <Link href={link.href}>
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                )
              })}
            </>
          )} */}
        </nav>
      </ScrollArea>
    </aside>
  );
}
