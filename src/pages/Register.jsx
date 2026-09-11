import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, MapPin } from 'lucide-react'
import Spinner from '../components/Spinner'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', city: '' })
  const [cities, setCities] = useState([])

  useEffect(() => {
    supabase.from('cities').select('name').eq('is_active', true).order('name')
      .then(({ data }) => setCities(data?.map((c) => c.name) || []))
  }, [])
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.phone) { setError('El teléfono es obligatorio'); return }
    if (!form.city) { setError('Debes seleccionar tu ciudad'); return }
    setLoading(true)
    setError('')

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone } }
    })

    if (signUpErr) {
      const msg = signUpErr.message
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('Este correo ya tiene una cuenta. Intenta iniciar sesión.')
      } else {
        setError(msg)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      // upsert por si el trigger ya lo creó
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        role: 'user',
        wallet_balance: 0,
      }, { onConflict: 'id' })
      navigate('/')
    } else {
      setError('No se pudo crear la cuenta. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 pt-12 pb-10">
        <button onClick={() => navigate('/login')} className="text-white/80 flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={16} /> Volver
        </button>
        <h1 className="text-white text-2xl font-bold">Crear cuenta</h1>
        <p className="text-primary-100 text-sm mt-1">Empieza a disfrutar de tus restaurantes favoritos</p>
      </div>

      <div className="flex-1 px-6 py-8">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Nombre completo <span className="text-red-500">*</span></label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={form.full_name} onChange={set('full_name')} required
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Juan Pérez" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Correo electrónico <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={form.email} onChange={set('email')} required
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="tu@correo.com" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Teléfono <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" value={form.phone} onChange={set('phone')} required
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="77000000" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Debe ser tu número de WhatsApp — el delivery te contactará aquí para entregarte tu pedido</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Ciudad <span className="text-red-500">*</span></label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select value={form.city} onChange={set('city')} required
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white">
                <option value="">Selecciona tu ciudad</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Contraseña <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} required minLength={6}
                className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Mínimo 6 caracteres" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Spinner size="sm" /> : 'Crear cuenta gratis'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-500 font-semibold">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
