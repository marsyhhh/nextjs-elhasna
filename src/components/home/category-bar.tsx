import Link from "next/link"
import { Ribbon, Shirt, Sparkles, Umbrella, Gem } from "lucide-react"

const categories = [
  { name: "Hijab", slug: "hijab", icon: Ribbon },
  { name: "Gamis", slug: "gamis", icon: Shirt },
  { name: "Tunik", slug: "tunik", icon: Sparkles },
  { name: "Mukena", slug: "mukena", icon: Umbrella },
  { name: "Aksesoris", slug: "aksesoris", icon: Gem },
]

export function CategoryBar() {
  return (
    <section className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-4 md:gap-8">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                  {cat.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
