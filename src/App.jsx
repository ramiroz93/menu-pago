import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './config/supabase'
import useStore from './store/useStore'
import { subscribeToPush } from './utils/pushNotifications'
import LoadingScreen from './components/LoadingScreen'

// Auth (carga inmediata — primera pantalla)
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Lazy loading — se cargan bajo demanda
const Privacidad = lazy(() => import('./pages/Privacidad'))
const UserLayout = lazy(() => import('./layouts/UserLayout'))
const Discover = lazy(() => import('./pages/user/Discover'))
const RestaurantDetail = lazy(() => import('./pages/user/RestaurantDetail'))
const Wallet = lazy(() => import('./pages/user/Wallet'))
const TopUp = lazy(() => import('./pages/user/TopUp'))
const MyOrders = lazy(() => import('./pages/user/MyOrders'))
const Profile = lazy(() => import('./pages/user/Profile'))
const RestaurantLayout = lazy(() => import('./layouts/RestaurantLayout'))
const RestaurantOrders = lazy(() => import('./pages/restaurant/Orders'))
const RestaurantMenu = lazy(() => import('./pages/restaurant/Menu'))
const RestaurantSales = lazy(() => import('./pages/restaurant/Sales'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminTopUps = lazy(() => import('./pages/admin/TopUps'))
const AdminRestaurants = lazy(() => import('./pages/admin/Restaurants'))
const AdminAllOrders = lazy(() => import('./pages/admin/AllOrders'))
const AdminMenuEditor = lazy(() => import('./pages/admin/MenuEditor'))
const AdminDelivery = lazy(() => import('./pages/admin/Delivery'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))

function RoleRouter() {
  const { profile } = useStore()
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role === 'admin') return <Navigate to="/admin" replace />
  if (profile.role === 'restaurant') return <Navigate to="/restaurante/pedidos" replace />
  return <Navigate to="/app" replace />
}

function ProtectedRoute({ role, children }) {
  const { profile } = useStore()
  if (!profile) return <Navigate to="/login" replace />
  if (role && profile.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { setUser, setProfile, setLoading, loading, profile } = useStore()

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    const fetchProfile = async (userId) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        setProfile(data)
        subscribeToPush(userId)
      } else if (user) {
        // Perfil no existe — lo creamos automáticamente
        const newProfile = {
          id: userId,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          email: user.email,
          role: 'user',
          wallet_balance: 0,
        }
        const { data: created } = await supabase.from('profiles').insert(newProfile).select().single()
        if (created) setProfile(created)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Listener en tiempo real: actualiza saldo y datos del perfil cuando el admin hace cambios
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel(`profile-${profile.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profile.id}`,
      }, (payload) => {
        setProfile({ ...profile, ...payload.new })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile?.id])

  if (loading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/olvide-contrasena" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacidad" element={<Privacidad />} />

        {/* Role dispatcher */}
        <Route path="/" element={<RoleRouter />} />

        {/* Usuario */}
        <Route path="/app" element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>}>
          <Route index element={<Discover />} />
          <Route path="restaurante/:id" element={<RestaurantDetail />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="wallet/recargar" element={<TopUp />} />
          <Route path="pedidos" element={<MyOrders />} />
          <Route path="perfil" element={<Profile />} />
        </Route>

        {/* Restaurante */}
        <Route path="/restaurante" element={<ProtectedRoute role="restaurant"><RestaurantLayout /></ProtectedRoute>}>
          <Route path="pedidos" element={<RestaurantOrders />} />
          <Route path="menu" element={<RestaurantMenu />} />
          <Route path="ventas" element={<RestaurantSales />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="recargas" element={<AdminTopUps />} />
          <Route path="restaurantes" element={<AdminRestaurants />} />
          <Route path="pedidos" element={<AdminAllOrders />} />
          <Route path="menu/:restaurantId" element={<AdminMenuEditor />} />
          <Route path="delivery" element={<AdminDelivery />} />
          <Route path="usuarios" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
