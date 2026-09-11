import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Spinner from '../components/Spinner'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header visual */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 pt-16 pb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-lg">
          <span className="text-primary-500 text-3xl font-black">M</span>
        </div>
        <h1 className="text-white text-2xl font-bold">Menu-Pago</h1>
        <p className="text-primary-100 text-sm mt-1">Descubre y paga en tus restaurantes favoritos</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8">
        <h2 className="text-xl font-bold text-dark mb-6">Iniciar sesión</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Correo electrónico</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="tu@correo.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end">
            <Link to="/olvide-contrasena" className="text-xs text-primary-500 font-semibold hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Spinner size="sm" /> : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-primary-500 font-semibold">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
