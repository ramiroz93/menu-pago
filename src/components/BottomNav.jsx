import { NavLink } from 'react-router-dom'
import { Home, Wallet, ShoppingBag, UtensilsCrossed, BarChart2, ClipboardList, Users, UserCircle, Store, Truck } from 'lucide-react'
import useStore from '../store/useStore'

const userLinks = [
  { to: '/app', icon: Home, label: 'Inicio', end: true },
  { to: '/app/wallet', icon: Wallet, label: 'Saldo' },
  { to: '/app/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/app/perfil', icon: UserCircle, label: 'Perfil' },
]

const restaurantLinks = [
  { to: '/restaurante/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { to: '/restaurante/menu', icon: UtensilsCrossed, label: 'Menú' },
  { to: '/restaurante/ventas', icon: BarChart2, label: 'Ventas' },
]

const adminLinks = [
  { to: '/admin', icon: Home, label: 'Panel', end: true },
  { to: '/admin/recargas', icon: Wallet, label: 'Recargas' },
  { to: '/admin/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { to: '/admin/delivery', icon: Truck, label: 'Delivery' },
  { to: '/admin/restaurantes', icon: Store, label: 'Locales' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
]

export default function BottomNav({ role }) {
  const { cartCount } = useStore()
  const links = role === 'admin' ? adminLinks : role === 'restaurant' ? restaurantLinks : userLinks
  const count = cartCount()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative
              ${isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
                {to === '/app/pedidos' && count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
