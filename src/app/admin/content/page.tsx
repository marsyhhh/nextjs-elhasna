"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ContentManagementPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-heading font-bold">Konten Halaman Utama</h1>

      <Card>
        <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Judul Banner 1</Label>
            <Input placeholder="Koleksi Eid Series" />
          </div>
          <div className="space-y-2">
            <Label>Subtitle Banner 1</Label>
            <Input placeholder="Tampil Anggun di Hari Spesial" />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea placeholder="Deskripsi banner..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Gambar Banner (URL)</Label>
            <Input placeholder="https://..." />
          </div>
          <Button className="rounded-full">Simpan Perubahan</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Promosi Musiman</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Judul Promo</Label>
            <Input placeholder="Flash Sale Akhir Bulan" />
          </div>
          <div className="space-y-2">
            <Label>Konten Promo</Label>
            <Textarea placeholder="Deskripsi promo..." rows={3} />
          </div>
          <Button className="rounded-full">Simpan</Button>
        </CardContent>
      </Card>
    </div>
  )
}
