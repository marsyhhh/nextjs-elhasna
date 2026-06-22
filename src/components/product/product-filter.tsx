"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Category {
  id: string
  name: string
  slug: string
}

export function ProductFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(searchParams.get("search") || "")

  const currentCategory = searchParams.get("category") || "all"
  const currentSort = searchParams.get("sort") || "terbaru"

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setSearch(searchParams.get("search") || "")
  }, [searchParams])

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    const qs = params.toString()
    router.push(qs ? `/products?${qs}` : "/products")
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateParams("search", search)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
      <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 w-full"
          />
        </div>
      </form>
      <div className="flex gap-3 w-full sm:w-auto">
        <Select
          value={currentCategory}
          onValueChange={(value) => updateParams("category", value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={currentSort}
          onValueChange={(value) => updateParams("sort", value === "terbaru" ? "" : value)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Terbaru" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="terbaru">Terbaru</SelectItem>
            <SelectItem value="created_at_asc">Terlama</SelectItem>
            <SelectItem value="price_asc">Termurah</SelectItem>
            <SelectItem value="price_desc">Termahal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
