import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../config/supabase'

const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      profile: null,
      loading: true,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      // Cart (solo usuario)
      cart: [],
      cartRestaurantId: null,

      addToCart: (item, restaurantId) => {
        const { cart, cartRestaurantId } = get()
        if (cartRestaurantId && cartRestaurantId !== restaurantId) {
          // Cambio de restaurante → limpiar carrito
          set({ cart: [{ ...item, quantity: 1 }], cartRestaurantId: restaurantId })
          return
        }
        const existing = cart.find((c) => c.id === item.id)
        if (existing) {
          set({ cart: cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c) })
        } else {
          set({ cart: [...cart, { ...item, quantity: 1 }], cartRestaurantId: restaurantId })
        }
      },

      removeFromCart: (itemId) => {
        const { cart } = get()
        const updated = cart
          .map((c) => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
          .filter((c) => c.quantity > 0)
        set({ cart: updated, cartRestaurantId: updated.length === 0 ? null : get().cartRestaurantId })
      },

      clearCart: () => set({ cart: [], cartRestaurantId: null }),

      cartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      cartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

      // Cache de menús por restaurante { [restaurantId]: { restaurant, items, ts } }
      menuCache: {},
      setMenuCache: (restaurantId, data) => set((state) => ({
        menuCache: { ...state.menuCache, [restaurantId]: { ...data, ts: Date.now() } }
      })),
      clearMenuCache: (restaurantId) => set((state) => {
        const next = { ...state.menuCache }
        delete next[restaurantId]
        return { menuCache: next }
      }),

      // Notificaciones no leídas
      unreadCount: 0,
      setUnreadCount: (n) => set({ unreadCount: n }),

      // Logout
      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, cart: [], cartRestaurantId: null, unreadCount: 0 })
      },
    }),
    {
      name: 'menupago-store',
      partialize: (state) => ({ cart: state.cart, cartRestaurantId: state.cartRestaurantId }),
    }
  )
)

export default useStore
