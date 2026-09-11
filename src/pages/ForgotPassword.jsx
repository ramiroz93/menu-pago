import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { Mail, ArrowLeft } from 'lucide-react'
import Spinner from '../components/Spinner'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://menu-pago.vercel.app/reset-password',
    })
    if (err) {
      setError('No se pudo enviar el correo. Verifica la dirección e intenta de nuevo.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 pt-16 pb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-lg">
          <span className="text-primary-500 text-3xl font-black">M</span>
        </div>
        <h1 className="text-white text-2xl font-bold">Menu-Pago</h1>
        <p className="text-primary-100 text-sm mt-1">Recupera tu cuenta</p>
      </div>

      <div className="flex-1 px-6 py-8">
        <Link to="/login" className="flex items-center gap-1.5 text-gray-400 text-sm mb-6 hover:text-gray-600">
          <ArrowLeft size={16} /> Volver al login
        </Link>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-dark mb-2">¡Correo enviado!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Revisá tu bandeja de entrada en <strong>{email}</strong>. Te enviamos un enlace para restablecer tu contraseña.
            </p>
            <p className="text-gray-400 text-xs mt-3">Si no lo ves, revisa la carpeta de spam.</p>
            <Link to="/login" className="inline-block mt-6 text-primary-500 font-semibold text-sm">
              Volver al login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-dark mb-2">¿Olvidaste tu contraseña?</h2>
            <p className="text-gray-500 text-sm mb-6">Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error && (
                <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Spinner size="sm" /> : 'Enviar enlace de recuperación'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
