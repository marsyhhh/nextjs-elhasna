"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Users, ShieldOff, ShieldCheck } from "lucide-react"

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users?role=customer")
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch { toast.error("Gagal memuat pelanggan") }
    setLoading(false)
  }

  async function handleToggleActive(user: any) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success(user.isActive ? "Pelanggan dinonaktifkan" : "Pelanggan diaktifkan")
      fetchUsers()
    } catch (err: any) { toast.error(err.message || "Gagal mengubah status") }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pelanggan</h1>
        <p className="text-sm text-slate-500 mt-0.5">{users.length} pelanggan</p>
      </div>

      {loading ? <p className="text-slate-400">Memuat...</p> : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Tgl Daftar</TableHead>
                <TableHead>Pesanan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-slate-900">{user.name || "-"}</TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell className="text-slate-600">{user.phone || "-"}</TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="text-slate-600">{user._count?.orders || 0}</TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="secondary" className="text-[10px]">Aktif</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.isActive ? (
                        <ShieldOff className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Belum ada pelanggan</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
