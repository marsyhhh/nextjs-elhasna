"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Plus, Trash2, ShieldOff, ShieldCheck, Shield, Users } from "lucide-react"

export default function AdminAdminsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "" })

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users?role=admin")
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch { toast.error("Gagal memuat admin") }
    setLoading(false)
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success("Admin berhasil ditambahkan")
      setOpen(false)
      setForm({ name: "", email: "", password: "" })
      fetchUsers()
    } catch (err: any) { toast.error(err.message || "Gagal menambah admin") }
  }

  async function handleToggleActive(user: any) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success(user.isActive ? "Admin dinonaktifkan" : "Admin diaktifkan")
      fetchUsers()
    } catch (err: any) { toast.error(err.message || "Gagal mengubah status") }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success("Admin berhasil dihapus")
      fetchUsers()
    } catch (err: any) { toast.error(err.message || "Gagal menghapus admin") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} admin</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Tambah Admin</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tambah Admin Baru</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2"><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nama Admin" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="admin@example.com" /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Minimal 6 karakter" minLength={6} /></div>
            <Button type="submit" className="w-full">Simpan Admin</Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? <p className="text-slate-400">Memuat...</p> : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-slate-900">{user.name || "-"}</TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="secondary" className="text-[10px]">Aktif</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(user)}>
                        {user.isActive ? (
                          <ShieldOff className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90">
                          <Trash2 className="h-3.5 w-3.5" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Admin</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus admin &quot;{user.name || user.email}&quot;? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Belum ada admin</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
