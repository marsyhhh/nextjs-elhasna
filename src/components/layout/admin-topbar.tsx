"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Bell, LogOut, Package } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AdminTopbar() {
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-sm text-slate-500">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors outline-none">
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 text-sm font-medium">Notifikasi</div>
            <DropdownMenuSeparator />
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi baru
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors outline-none">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
              {session?.user?.name?.charAt(0) || "A"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{session?.user?.name || "Admin"}</p>
              <p className="text-[10px] text-slate-400">{session?.user?.role === "SUPERADMIN" ? "Superadmin" : "Admin"}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Link href="/" className="w-full flex items-center gap-2">
                <Package className="h-4 w-4" />
                Lihat Toko
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
