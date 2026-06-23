import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  id: string
  productId: string
  name: string
  slug: string
  price: number
  discountPrice?: number | null
  image: string
  variantId?: string
  variantName?: string
  combinationId?: string
  quantity: number
  weight: number
  stock: number
}

export interface VoucherInfo {
  code: string
  discount: number
  isShippingFree: boolean
  voucherName: string
}

interface CartStore {
  items: CartItem[]
  voucher: VoucherInfo | null
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotalItems: () => number
  applyVoucher: (voucher: VoucherInfo) => void
  removeVoucher: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      voucher: null,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.id === item.id
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),
      clearCart: () => set({ items: [], voucher: null }),
      getSubtotal: () => {
        return get().items.reduce(
          (total, item) =>
            total + (item.discountPrice || item.price) * item.quantity,
          0
        )
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      applyVoucher: (voucher) => set({ voucher }),
      removeVoucher: () => set({ voucher: null }),
    }),
    { name: "elhasna-cart" }
  )
)
