"use client"

import { useSession, signOut } from "next-auth/react"
import { AdminSidebarToggle } from "@/components/layout/admin-sidebar"
import { Bell, LogOut, Package } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <AdminSidebarToggle onClick={onMenuClick!} />
        <div className="h-2 w-2 rounded-full bg-emerald-500 hidden sm:block" />
        <span className="text-sm text-slate-500 hidden sm:block">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors outline-none">
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 text-sm font-medium">Notifikasi</div>
            <DropdownMenuSeparator />
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi baru
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors outline-none">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
              {session?.user?.name?.charAt(0) || "A"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">
                {session?.user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-400">
                {session?.user?.role === "SUPERADMIN" ? "Superadmin" : "Admin"}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <a href="/" className="flex items-center gap-2 cursor-pointer">
                <Package className="h-4 w-4" />
                Lihat Toko
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
