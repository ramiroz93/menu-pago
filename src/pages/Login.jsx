import { useNavigate } from 'react-router-dom'
import { User, Store, ShieldCheck } from 'lucide-react'
import { loginComoDemo } from '../config/supabase'
import useStore from '../store/useStore'

const OPCIONES = [
  { role: 'user', icon: User, titulo: 'Cliente', desc: 'Descubre restaurantes, pide y paga con saldo prepagado' },
  { role: 'restaurant', icon: Store, titulo: 'Restaurante', desc: 'Recibe pedidos, gestiona tu menú y tus ventas' },
  { role: 'admin', icon: ShieldCheck, titulo: 'Administrador', desc: 'Panel general: restaurantes, usuarios, recargas' },
]

export default function Login() {
  const navigate = useNavigate()
  const { setUser, setProfile } = useStore()

  const entrar = (role) => {
    const profile = loginComoDemo(role)
    setUser({ id: profile.id, email: profile.email })
    setProfile(profile)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header visual */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 pt-16 pb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-lg">
          <span className="text-primary-500 text-3xl font-black">M</span>
        </div>
        <h1 className="text-white text-2xl font-bold">Menu-Pago</h1>
        <p className="text-primary-100 text-sm mt-1 text-center">Descubre y paga en tus restaurantes favoritos</p>
      </div>

      {/* Accesos de demo */}
      <div className="flex-1 px-6 py-8">
        <h2 className="text-xl font-bold text-dark mb-1">Demo de portfolio</h2>
        <p className="text-sm text-gray-500 mb-6">Sin backend real — elige con qué rol quieres entrar a probar la app. Los datos son ficticios y viven solo en esta pestaña.</p>

        <div className="space-y-3">
          {OPCIONES.map(({ role, icon: Icon, titulo, desc }) => (
            <button
              key={role}
              onClick={() => entrar(role)}
              className="w-full flex items-center gap-4 text-left border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 rounded-2xl p-4 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-dark text-sm">Entrar como {titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
