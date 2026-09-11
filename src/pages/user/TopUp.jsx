import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, CheckCircle, QrCode, Download } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import Spinner from '../../components/Spinner'
import { APP_CONFIG, buildWhatsAppLink } from '../../config/app.config'

export default function TopUp() {
  const navigate = useNavigate()
  const { profile } = useStore()
  const [selectedTier, setSelectedTier] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const amount = selectedTier ? selectedTier.amount : Number(customAmount) || 0
  const bonus = Math.floor(amount * APP_CONFIG.topUpBonus * 100) / 100
  const total = amount + bonus

  const handleSubmit = async () => {
    if (amount < APP_CONFIG.minTopUpAmount) return
    setLoading(true)

    const { error } = await supabase.from('top_up_requests').insert({
      user_id: profile.id,
      amount,
      bonus_amount: bonus,
      total_credited: total,
      status: 'pending',
    })

    if (!error) {
      // Abrir WhatsApp al admin
      const msg = `Hola, soy ${profile.full_name} (${profile.email}). Quiero recargar ${APP_CONFIG.currency} ${amount} en Menu-Pago. Me corresponden ${APP_CONFIG.currency} ${total} con el bonus. Ya realicé el pago al QR. ¿Puedes confirmarlo?`
      const url = buildWhatsAppLink(msg)
      window.open(url, '_blank')
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <CheckCircle size={64} className="text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-dark text-center">¡Solicitud enviada!</h2>
        <p className="text-gray-500 text-sm text-center mt-2">
          Tu solicitud de recarga por <strong>{APP_CONFIG.currency} {amount}</strong> está pendiente.<br />
          El administrador la aprobará en breve y recibirás <strong>{APP_CONFIG.currency} {total}</strong> en tu saldo.
        </p>
        <button onClick={() => navigate('/app/wallet')} className="mt-8 bg-primary-500 text-white font-semibold px-8 py-3 rounded-xl">
          Volver a mi wallet
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-4 pt-12 pb-6">
        <button onClick={() => navigate(-1)} className="text-white/80 flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={16} /> Volver
        </button>
        <h1 className="text-white text-xl font-bold">Recargar saldo</h1>
        <p className="text-primary-100 text-sm mt-1">+5% de bonus en toda recarga</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">

        {/* Montos rápidos */}
        <div>
          <h2 className="font-semibold text-dark text-sm mb-3">Elige un monto</h2>
          <div className="grid grid-cols-2 gap-2">
            {APP_CONFIG.topUpTiers.map((tier) => (
              <button key={tier.amount} onClick={() => { setSelectedTier(tier); setCustomAmount('') }}
                className={`border-2 rounded-xl p-3 text-left transition-colors ${selectedTier?.amount === tier.amount ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-200'}`}>
                <p className="font-bold text-dark text-sm">{APP_CONFIG.currency} {tier.amount}</p>
                <p className="text-green-600 text-xs font-medium">→ recibes {APP_CONFIG.currency} {tier.amount + tier.bonus}</p>
                <p className="text-gray-400 text-[10px]">+{APP_CONFIG.currency} {tier.bonus} bonus</p>
              </button>
            ))}
          </div>
        </div>

        {/* Monto personalizado */}
        <div>
          <h2 className="font-semibold text-dark text-sm mb-2">O ingresa otro monto</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">{APP_CONFIG.currency}</span>
            <input type="number" min={APP_CONFIG.minTopUpAmount} value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedTier(null) }}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
              placeholder={`Mínimo ${APP_CONFIG.currency} ${APP_CONFIG.minTopUpAmount}`} />
          </div>
          {customAmount && Number(customAmount) > 0 && Number(customAmount) < APP_CONFIG.minTopUpAmount && (
            <p className="text-red-500 text-xs mt-1 font-medium">El monto mínimo es {APP_CONFIG.currency} {APP_CONFIG.minTopUpAmount}</p>
          )}
          {amount >= APP_CONFIG.minTopUpAmount && <p className="text-green-600 text-xs mt-1 font-medium">Recibirás {APP_CONFIG.currency} {total.toFixed(2)} (+{APP_CONFIG.currency} {bonus.toFixed(2)} bonus)</p>}
        </div>

        {/* QR de pago */}
        {amount >= APP_CONFIG.minTopUpAmount && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <h2 className="font-semibold text-dark text-sm mb-3 flex items-center gap-2"><QrCode size={16} /> Realiza el pago</h2>
            <div className="flex flex-col items-center">
              {APP_CONFIG.paymentQR.imageUrl ? (
                <div className="w-full rounded-2xl overflow-hidden border border-gray-200 bg-white p-3">
                  <img
                    src={APP_CONFIG.paymentQR.imageUrl}
                    alt="QR de pago"
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2">
                  <QrCode size={40} className="text-gray-300" />
                  <p className="text-xs text-gray-400 text-center px-2">Coloca aquí la imagen de tu QR de pago</p>
                </div>
              )}
              <a href={APP_CONFIG.paymentQR.imageUrl} download="QR-Menu-Pago.png"
                className="mt-2 flex items-center gap-1.5 bg-primary-50 text-primary-600 text-xs font-semibold px-4 py-2 rounded-xl">
                <Download size={14} /> Descargar QR
              </a>
              <p className="text-gray-500 text-xs mt-3 text-center">Acepta pagos desde cualquier banco · Tigo Money · Yape</p>
              <p className="text-gray-500 text-xs mt-1">Monto a pagar: <strong className="text-dark">{APP_CONFIG.currency} {amount.toFixed(2)}</strong></p>
            </div>
          </div>
        )}

        {/* Botón confirmar */}
        {amount >= APP_CONFIG.minTopUpAmount && (
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            {loading ? <Spinner size="sm" /> : <><MessageCircle size={18} /> Ya pagué — Avisar por WhatsApp</>}
          </button>
        )}

        <p className="text-xs text-gray-400 text-center">
          Al tocar el botón se abrirá WhatsApp para notificar a MenuPago. Tu saldo se acreditará después de la verificación.
        </p>
      </div>
    </div>
  )
}
