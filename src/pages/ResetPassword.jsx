import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Spinner from '../components/Spinner'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const type = hashParams.get('type')
    const accessToken = hashParams.get('access_token')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
        if (err) setError('El enlace ha expirado. Solicita uno nuevo desde la app.')
        else setReady(true)
      })
    } else if (type === 'recovery' || accessToken) {
      setTimeout(() => setReady(true), 500)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
    } else {
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
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
        <p className="text-primary-100 text-sm mt-1">Nueva contraseña</p>
      </div>

      <div className="flex-1 px-6 py-8">
        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-dark mb-2">¡Contraseña actualizada!</h2>
            <p className="text-gray-500 text-sm">Redirigiendo al login en unos segundos...</p>
          </div>
        ) : !ready ? (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="text-gray-400 text-sm mt-4">Verificando enlace...</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-dark mb-2">Crear nueva contraseña</h2>
            <p className="text-gray-500 text-sm mb-6">Elige una contraseña segura para tu cuenta.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Nueva contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Confirmar contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Repite la contraseña"
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
                {loading ? <Spinner size="sm" /> : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
