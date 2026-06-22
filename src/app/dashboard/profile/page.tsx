"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  const { data: session } = useSession()

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-heading font-bold">Profil Saya</h1>
      <Card>
        <CardHeader><CardTitle>Informasi Akun</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{session?.user?.name || "Pengguna"}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <div className="space-y-2"><Label>Nama Lengkap</Label><Input defaultValue={session?.user?.name || ""} /></div>
          <div className="space-y-2"><Label>Email</Label><Input defaultValue={session?.user?.email || ""} disabled /></div>
          <div className="space-y-2"><Label>No. Telepon</Label><Input placeholder="08123456789" /></div>
          <Button className="rounded-full">Simpan Perubahan</Button>
        </CardContent>
      </Card>
    </div>
  )
}
