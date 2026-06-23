"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { MapPin, Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"

interface AreaResult {
  id: string
  name: string
  postal_code: number
  administrative_division_level_2_name: string
  administrative_division_level_1_name: string
}

const emptyForm = {
  label: "Utama",
  recipient: "",
  phone: "",
  street: "",
  city: "",
  province: "",
  postalCode: "",
  areaId: "",
  isDefault: false,
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted] = useState(() => typeof window !== "undefined")
  const [open, setOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [areaSearch, setAreaSearch] = useState("")
  const [areaResults, setAreaResults] = useState<AreaResult[]>([])
  const [searchingArea, setSearchingArea] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => { fetchAddresses() }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleAreaSearch(value: string) {
    setAreaSearch(value)
    setForm({ ...form, city: "", province: "", postalCode: "", areaId: "" })

    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (value.length < 2) {
      setAreaResults([])
      setShowResults(false)
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setSearchingArea(true)
      try {
        const res = await fetch(`/api/biteship/maps/areas?input=${encodeURIComponent(value)}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setAreaResults(data)
          setShowResults(data.length > 0)
        }
      } catch {
        setAreaResults([])
      }
      setSearchingArea(false)
    }, 400)
  }

  function selectArea(area: AreaResult) {
    setForm({
      ...form,
      city: area.administrative_division_level_2_name || "",
      province: area.administrative_division_level_1_name || "",
      postalCode: String(area.postal_code || ""),
      areaId: area.id,
    })
    setAreaSearch(area.name)
    setShowResults(false)
  }

  async function fetchAddresses() {
    try { setAddresses(await (await fetch("/api/addresses")).json()) }
    catch { toast.error("Gagal memuat alamat") }
    setLoading(false)
  }

  function handleOpenCreate() {
    setEditingAddress(null)
    setForm(emptyForm)
    setAreaSearch("")
    setAreaResults([])
    setOpen(true)
  }

  function handleOpenEdit(addr: any) {
    setEditingAddress(addr)
    setForm({
      label: addr.label,
      recipient: addr.recipient,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
      areaId: addr.areaId || "",
      isDefault: addr.isDefault,
    })
    setAreaSearch(`${addr.city}, ${addr.province}`)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingAddress) {
        const res = await fetch(`/api/addresses/${editingAddress.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Gagal memperbarui alamat")
        }
        toast.success("Alamat berhasil diperbarui")
      } else {
        const res = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Gagal menyimpan alamat")
        }
        toast.success("Alamat berhasil ditambahkan")
      }
      setOpen(false)
      setEditingAddress(null)
      setForm(emptyForm)
      setAreaSearch("")
      fetchAddresses()
    } catch (err: any) { toast.error(err.message) }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menghapus alamat")
      toast.success("Alamat berhasil dihapus")
      setDeleteTarget(null)
      fetchAddresses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus alamat")
    }
  }

  if (!mounted || loading) return <p className="text-muted-foreground">Memuat...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Alamat Saya</h1>
        <Button onClick={handleOpenCreate}><Plus className="h-4 w-4" /> Tambah Alamat</Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditingAddress(null); setForm(emptyForm); setAreaSearch("") }; setOpen(v) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingAddress ? "Edit Alamat" : "Tambah Alamat Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
              <div className="space-y-2"><Label>Penerima</Label><Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label>No. Telepon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Alamat Lengkap</Label><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required /></div>

            <div className="space-y-2 relative" ref={searchRef}>
              <Label>Cari Kota / Kecamatan</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ketik nama kota atau kecamatan..."
                  value={areaSearch}
                  onChange={(e) => handleAreaSearch(e.target.value)}
                  onFocus={() => areaResults.length > 0 && setShowResults(true)}
                  className="pl-9"
                />
                {searchingArea && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {showResults && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {areaResults.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0"
                      onClick={() => selectArea(area)}
                    >
                      <span className="font-medium">{area.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {area.administrative_division_level_2_name}, {area.administrative_division_level_1_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Kota</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Provinsi</Label><Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Kode Pos</Label><Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required /></div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="default" checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v as boolean })} />
              <Label htmlFor="default">Jadikan alamat utama</Label>
            </div>
            <Button type="submit" className="w-full">{editingAddress ? "Perbarui" : "Simpan"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {addresses.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{addr.recipient}</p>
                  {addr.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Utama</span>}
                </div>
                <p className="text-xs text-muted-foreground">{addr.phone}</p>
                <p className="text-sm mt-1">{addr.street}</p>
                <p className="text-xs text-muted-foreground">{addr.city}, {addr.province} {addr.postalCode}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(addr)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog open={deleteTarget === addr.id} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
                  <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-2.5 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90" onClick={() => setDeleteTarget(addr.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Alamat</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus alamat &quot;{addr.label}&quot; - {addr.recipient}? Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(addr.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {addresses.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Belum ada alamat tersimpan</p>
        )}
      </div>
    </div>
  )
}
