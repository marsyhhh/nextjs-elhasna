const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

interface MedusaError {
  code: string
  message: string
  type: string
}

interface MedusaResponse<T> {
  data?: T
  error?: MedusaError
}

class MedusaClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor() {
    this.baseUrl = `${MEDUSA_BACKEND_URL}/store`
    this.headers = {
      "Content-Type": "application/json",
    }
  }

  setAuthToken(token: string) {
    this.headers["Authorization"] = `Bearer ${token}`
  }

  clearAuthToken() {
    delete this.headers["Authorization"]
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<MedusaResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: { ...this.headers, ...options.headers },
      })
      const json = await res.json()
      if (!res.ok) {
        return { error: json }
      }
      return { data: json }
    } catch (error) {
      return {
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
          type: "network_error",
        },
      }
    }
  }

  // ─── Products ─────────────────────────────────────────
  async getProducts(params?: {
    limit?: number
    offset?: number
    category_id?: string[]
    q?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    if (params?.q) searchParams.set("q", params.q)
    if (params?.category_id?.length) {
      params.category_id.forEach((id) => searchParams.append("category_id[]", id))
    }
    const qs = searchParams.toString()
    return this.request<{
      products: any[]
      count: number
      offset: number
      limit: number
    }>(`/products${qs ? `?${qs}` : ""}`)
  }

  async getProduct(id: string) {
    return this.request<{ product: any }>(`/products/${id}`)
  }

  // ─── Categories ───────────────────────────────────────
  async getCategories() {
    return this.request<{ product_categories: any[] }>("/product-categories")
  }

  // ─── Cart ─────────────────────────────────────────────
  async createCart() {
    return this.request<{ cart: any }>("/carts", { method: "POST" })
  }

  async getCart(id: string) {
    return this.request<{ cart: any }>(`/carts/${id}`)
  }

  async addToCart(cartId: string, variantId: string, quantity: number) {
    return this.request<{ cart: any }>(`/carts/${cartId}/line-items`, {
      method: "POST",
      body: JSON.stringify({ variant_id: variantId, quantity }),
    })
  }

  // ─── Auth ─────────────────────────────────────────────
  async login(email: string, password: string) {
    return this.request<{ token: string }>("/auth", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email: string, password: string) {
    return this.request<{ customer: any }>("/customers", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  // ─── Orders ───────────────────────────────────────────
  async getOrders(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    const qs = searchParams.toString()
    return this.request<{ orders: any[] }>(`/orders${qs ? `?${qs}` : ""}`)
  }

  async getOrder(id: string) {
    return this.request<{ order: any }>(`/orders/${id}`)
  }

  // ─── Shipping / Fulfillment ───────────────────────────
  async getShippingOptions(cartId: string) {
    return this.request<{ shipping_options: any[] }>(
      `/shipping-options/${cartId}`
    )
  }
}

// ─── Admin Client ─────────────────────────────────────────
class MedusaAdminClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor() {
    this.baseUrl = `${MEDUSA_BACKEND_URL}/admin`
    this.headers = {
      "Content-Type": "application/json",
    }
  }

  setAuthToken(token: string) {
    this.headers["Authorization"] = `Bearer ${token}`
  }

  clearAuthToken() {
    delete this.headers["Authorization"]
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<MedusaResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: { ...this.headers, ...options.headers },
      })
      const json = await res.json()
      if (!res.ok) {
        return { error: json }
      }
      return { data: json }
    } catch (error) {
      return {
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
          type: "network_error",
        },
      }
    }
  }

  // ─── Auth ───────────────────────────────────
  async login(email: string, password: string) {
    const res = await this.request<{ token: string }>("/auth", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    if (res.data?.token) {
      this.setAuthToken(res.data.token)
    }
    return res
  }

  // ─── Products ──────────────────────────────
  async getProducts(params?: {
    limit?: number
    offset?: number
    q?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    if (params?.q) searchParams.set("q", params.q)
    const qs = searchParams.toString()
    return this.request<{ products: any[]; count: number }>(
      `/products${qs ? `?${qs}` : ""}`
    )
  }

  async getProduct(id: string) {
    return this.request<{ product: any }>(`/products/${id}`)
  }

  async createProduct(data: any) {
    return this.request<{ product: any }>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateProduct(id: string, data: any) {
    return this.request<{ product: any }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: string) {
    return this.request<{ id: string }>(`/products/${id}`, {
      method: "DELETE",
    })
  }

  // ─── Orders ────────────────────────────────
  async getOrders(params?: { limit?: number; offset?: number; q?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    if (params?.q) searchParams.set("q", params.q)
    const qs = searchParams.toString()
    return this.request<{ orders: any[]; count: number }>(
      `/orders${qs ? `?${qs}` : ""}`
    )
  }

  async getOrder(id: string) {
    return this.request<{ order: any }>(`/orders/${id}`)
  }

  async updateOrder(id: string, data: any) {
    return this.request<{ order: any }>(`/orders/${id}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // ─── Customers ─────────────────────────────
  async getCustomers(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    const qs = searchParams.toString()
    return this.request<{ customers: any[]; count: number }>(
      `/customers${qs ? `?${qs}` : ""}`
    )
  }

  // ─── Discounts / Vouchers ──────────────────
  async getDiscounts(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    const qs = searchParams.toString()
    return this.request<{ discounts: any[]; count: number }>(
      `/discounts${qs ? `?${qs}` : ""}`
    )
  }

  async createDiscount(data: any) {
    return this.request<{ discount: any }>("/discounts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // ─── Analytics ─────────────────────────────
  async getAnalytics(params?: {
    date_from?: string
    date_to?: string
    interval?: "day" | "week" | "month"
  }) {
    const searchParams = new URLSearchParams()
    if (params?.date_from) searchParams.set("date_from", params.date_from)
    if (params?.date_to) searchParams.set("date_to", params.date_to)
    if (params?.interval) searchParams.set("interval", params.interval)
    const qs = searchParams.toString()
    return this.request<{ analytics: any }>(
      `/analytics${qs ? `?${qs}` : ""}`
    )
  }

  // ─── Inventory ─────────────────────────────
  async getInventoryItems(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    const qs = searchParams.toString()
    return this.request<{ inventory_items: any[]; count: number }>(
      `/inventory-items${qs ? `?${qs}` : ""}`
    )
  }
}

export const medusaClient = new MedusaClient()
export const medusaAdmin = new MedusaAdminClient()
