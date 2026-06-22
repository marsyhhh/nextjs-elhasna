"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { MapPin, Plus } from "lucide-react"

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted] = useState(() => typeof window !== "undefined")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ label: "Utama", recipient: "", phone: "", street: "", city: "", cityId: "", province: "", provinceId: "", postalCode: "", isDefault: false })

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => { fetchAddresses() }, [])

  useEffect(() => {
    if (!open) return
    fetchProvinces()
  }, [open])

  useEffect(() => {
    if (form.provinceId) {
      fetchCities(form.provinceId)
    }
  }, [form.provinceId])

  async function fetchAddresses() {
    try { setAddresses(await (await fetch("/api/addresses")).json()) }
    catch { toast.error("Gagal memuat alamat") }
    setLoading(false)
  }

  async function fetchProvinces() {
    setLoadingProvinces(true)
    try {
      const res = await fetch("/api/rajaongkir/provinces")
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) {
        toast.error(data.error || "Gagal memuat provinsi")
        return
      }
      setProvinces(data)
    } catch { toast.error("Gagal memuat provinsi") }
    setLoadingProvinces(false)
  }

  async function fetchCities(provinceId: string) {
    setLoadingCities(true)
    setCities([])
    try {
      const res = await fetch(`/api/rajaongkir/cities?province=${provinceId}`)
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) {
        toast.error(data.error || "Gagal memuat kota")
        return
      }
      setCities(data)
    } catch { toast.error("Gagal memuat kota") }
    setLoadingCities(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      toast.success("Alamat berhasil ditambahkan")
      setOpen(false)
      setForm({ label: "Utama", recipient: "", phone: "", street: "", city: "", cityId: "", province: "", provinceId: "", postalCode: "", isDefault: false })
      fetchAddresses()
    } catch { toast.error("Gagal menyimpan alamat") }
  }

  if (!mounted || loading) return <p className="text-muted-foreground">Memuat...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Alamat Saya</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg h-7 gap-1 px-2.5 text-[0.8rem] font-medium whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">
            <Plus className="h-4 w-4" /> Tambah Alamat
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Alamat Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
                <div className="space-y-2"><Label>Penerima</Label><Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>No. Telepon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Alamat Lengkap</Label><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Provinsi</Label>
                  <Select
                    value={form.provinceId || null}
                    onValueChange={(v) => {
                      const p = provinces.find((p) => p.id === v)
                      setForm({ ...form, provinceId: v, province: p?.name || "", cityId: "", city: "" })
                    }}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder={loadingProvinces ? "Memuat..." : "Pilih provinsi"} /></SelectTrigger>
                    <SelectContent className="z-[60]">
                      {provinces.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kota</Label>
                  <Select
                    value={form.cityId || null}
                    onValueChange={(v) => {
                      const c = cities.find((c) => c.id === v)
                      setForm({ ...form, cityId: v, city: c?.name || "" })
                    }}
                    disabled={!form.provinceId}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder={!form.provinceId ? "Pilih provinsi dulu" : loadingCities ? "Memuat..." : "Pilih kota"} /></SelectTrigger>
                    <SelectContent className="z-[60]">
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Kode Pos</Label><Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required /></div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="default" checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v as boolean })} />
                <Label htmlFor="default">Jadikan alamat utama</Label>
              </div>
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
