import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Shell } from "@/components/shell"

export const metadata: Metadata = {
  title: "Elhasna Hijab - Fashion Muslim Modern",
  description: "Toko fashion muslim modern dengan koleksi hijab, gamis, tunik, mukena dan aksesoris pilihan.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  )
}
