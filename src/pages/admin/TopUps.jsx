import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, MessageCircle, Wallet, X } from 'lucide-react'
import { supabase } from '../../config/supabase'
import Spinner from '../../components/Spinner'
import { APP_CONFIG } from '../../config/app.config'

const userWhatsApp = (phone, message) => {
  const clean = (phone || '').replace(/\D/g, '')
  if (!clean) return null
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

let _audioCtx = null
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

function playAdminAlert() {
  try {
    const ctx = getAudioCtx()
    const now = ctx.currentTime
    const notes = [1400, 1000, 1400, 1000, 1600, 1000, 1600, 1200]
    const beepDuration = 0.5
    const gap = 0.65

    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.value = notes[i]
      const t = now + i * gap
      gain.gain.setValueAtTime(1.5, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + beepDuration)
      osc.start(t)
      osc.stop(t + beepDuration)
    }
  } catch (e) {}
}

const REJECTION_REASONS = [
  'Comprobante de pago no válido',
  'Monto transferido no coincide',
  'Comprobante ya utilizado anteriormente',
  'No se recibió el pago',
  'Datos del comprobante ilegibles',
]

export default function AdminTopUps() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [processing, setProcessing] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const fetch = async () => {
    const { data } = await supabase
      .from('top_up_requests')
      .select('*, profiles(full_name, email, phone, wallet_balance)')
      .order('created_at', { ascending: false })
      .limit(50)
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetch()

    const unlock = () => { try { getAudioCtx() } catch (e) {} }
    window.addEventListener('touchstart', unlock, { once: true })
    window.addEventListener('click', unlock, { once: true })

    const channel = supabase.channel('admin-topups')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'top_up_requests' },
        () => { playAdminAlert(); fetch() }
      ).subscribe()

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('click', unlock)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const pendingCount = requests.filter((r) => r.status === 'pending').length
      if (pendingCount > 0) playAdminAlert()
    }, 30000)
    return () => clearInterval(interval)
  }, [requests])

  const approve = async (req) => {
    setProcessing(req.id)
    const { error } = await supabase.rpc('credit_top_up', { p_request_id: req.id })
    if (error) alert('Error al aprobar: ' + error.message)
    await fetch()
    setProcessing(null)
  }

  const openRejectModal = (req) => {
    setRejectModal(req)
    setSelectedReason('')
    setCustomReason('')
  }

  const confirmReject = async () => {
    const reason = selectedReason === 'other' ? customReason.trim() : selectedReason
    if (!reason) return
    const req = rejectModal
    setRejectModal(null)
    setProcessing(req.id)
    await supabase.from('top_up_requests').update({ status: 'rejected', rejection_reason: reason }).eq('id', req.id)
    await fetch()
    setProcessing(null)
  }

  const filtered = requests.filter((r) => r.status === tab)

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white px-4 pt-14 pb-0 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-dark mb-3">Recargas de saldo</h1>
        <div className="flex border-b border-gray-100">
          {[['pending','Pendientes'], ['approved','Aprobadas'], ['rejected','Rechazadas']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${tab === k ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-400'}`}>
              {l}
              {k === 'pending' && requests.filter((r) => r.status === 'pending').length > 0 && (
                <span className="ml-1 bg-primary-500 text-white text-[9px] rounded-full px-1.5 py-0.5">
                  {requests.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Wallet size={40} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Sin solicitudes en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => {
              const approvedMsg = `Hola ${req.profiles?.full_name}, tu recarga #${req.reload_number || ''} de ${APP_CONFIG.currency} ${Number(req.amount).toFixed(2)} fue *aprobada*. Se acreditaron ${APP_CONFIG.currency} ${Number(req.total_credited).toFixed(2)} en tu saldo de ${APP_CONFIG.name}. ¡Gracias!`
              const rejectedMsg = `Hola ${req.profiles?.full_name}, tu solicitud de recarga #${req.reload_number || ''} de ${APP_CONFIG.currency} ${Number(req.amount).toFixed(2)} fue *rechazada*.${req.rejection_reason ? ` Motivo: ${req.rejection_reason}.` : ''} Comunícate con nosotros si tienes dudas.`
              const waLink = req.profiles?.phone ? userWhatsApp(req.profiles.phone, req.status === 'rejected' ? rejectedMsg : approvedMsg) : null

              return (
              <div key={req.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-dark text-sm">{req.profiles?.full_name}</p>
                      {req.reload_number && (
                        <span className="text-[10px] text-gray-400 font-semibold">#{req.reload_number}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{req.profiles?.email}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Solicita</p>
                    <p className="font-bold text-dark">{APP_CONFIG.currency} {Number(req.amount).toFixed(2)}</p>
                    <p className="text-green-600 text-xs font-semibold">→ acreditar {APP_CONFIG.currency} {Number(req.total_credited).toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-2.5 mb-3 text-xs text-gray-500 flex justify-between">
                  <span>Saldo actual: <strong>{APP_CONFIG.currency} {Number(req.profiles?.wallet_balance || 0).toFixed(2)}</strong></span>
                  <span>Bonus: +{APP_CONFIG.currency} {Number(req.bonus_amount).toFixed(2)}</span>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={16} className="text-green-600" />
                      </a>
                    )}
                    <button onClick={() => approve(req)} disabled={processing === req.id}
                      className="flex-1 bg-green-500 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 disabled:opacity-60">
                      {processing === req.id ? <Spinner size="sm" /> : <><CheckCircle size={14} /> Aprobar y acreditar</>}
                    </button>
                    <button onClick={() => openRejectModal(req)} disabled={processing === req.id}
                      className="flex-1 bg-red-100 text-red-600 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 disabled:opacity-60">
                      <XCircle size={14} /> Rechazar
                    </button>
                  </div>
                )}

                {req.status === 'approved' && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <p className="text-green-600 text-xs font-semibold">✓ Saldo acreditado</p>
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                        <MessageCircle size={13} className="text-green-600" />
                      </a>
                    )}
                  </div>
                )}
                {req.status === 'rejected' && (
                  <div>
                    <div className="flex items-center justify-center gap-2 py-1">
                      <p className="text-red-500 text-xs font-semibold">✕ Solicitud rechazada</p>
                      {waLink && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                          <MessageCircle size={13} className="text-red-500" />
                        </a>
                      )}
                    </div>
                    {req.rejection_reason && (
                      <p className="text-[11px] text-red-400 text-center mt-1">Motivo: {req.rejection_reason}</p>
                    )}
                  </div>
                )}
              </div>
              )
            })}
          </div>
        )}
      </div>
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-dark text-sm">Motivo del rechazo</h3>
              <button onClick={() => setRejectModal(null)} className="text-gray-400"><X size={18} /></button>
            </div>

            <div className="space-y-2 mb-4">
              {REJECTION_REASONS.map((r) => (
                <button key={r} onClick={() => { setSelectedReason(r); setCustomReason('') }}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-colors ${selectedReason === r ? 'border-red-400 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                  {r}
                </button>
              ))}
              <button onClick={() => setSelectedReason('other')}
                className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-colors ${selectedReason === 'other' ? 'border-red-400 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                Otro motivo...
              </button>
            </div>

            {selectedReason === 'other' && (
              <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Escribe el motivo..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 mb-4 resize-none focus:outline-none focus:border-red-300"
                rows={3} autoFocus />
            )}

            <button onClick={confirmReject}
              disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim())}
              className="w-full bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-1">
              <XCircle size={14} /> Confirmar rechazo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
