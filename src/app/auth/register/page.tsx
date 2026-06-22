"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FcGoogle } from "react-icons/fc"
import { Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (form.password !== form.confirmPassword) {
      toast.error("Password tidak cocok")
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Gagal mendaftar")
        setLoading(false)
        return
      }

      toast.success("Pendaftaran berhasil!")

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push("/")
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan, silakan coba lagi")
    }
    setLoading(false)
  }

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Card className="w-full max-w-md mx-4">
      <CardHeader className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 justify-center">
          <span className="text-2xl font-heading font-bold text-primary">Elhasna</span>
          <span className="text-2xl font-heading font-light">Hijab</span>
        </Link>
        <CardTitle className="text-xl">Daftar Akun</CardTitle>
        <CardDescription>Buat akun baru Elhasna Hijab</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" placeholder="Nama Anda" className="pl-9" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="nama@email.com" className="pl-9" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="08123456789" className="pl-9" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Minimal 6 karakter" className="pl-9 pr-9" value={form.password} onChange={(e) => updateField("password", e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Ulangi password" className="pl-9" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} required />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </Button>
        </form>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">atau</span>
        </div>

        <Button variant="outline" className="w-full gap-2" onClick={() => signIn("google", { callbackUrl: "/" })}>
          <FcGoogle className="h-5 w-5" />
          Lanjutkan dengan Google
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">Masuk</Link>
        </p>
      </CardFooter>
    </Card>
  )
}
