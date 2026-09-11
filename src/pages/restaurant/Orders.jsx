import { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, Clock, ChefHat, Bike, Navigation, MapPin, Copy, ClipboardCheck, AlertTriangle, X, MessageCircle } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import Spinner from '../../components/Spinner'
import { APP_CONFIG, buildWhatsAppLink } from '../../config/app.config'
import { isRestaurantOpen } from '../../utils/scheduleUtils'
import CountdownTimer from '../../components/CountdownTimer'

const DELIVERY_TIMES = [10, 15, 20, 25, 30, 40, 50, 60]

let _audioCtx = null
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

function playOrderAlert() {
  try {
    const ctx = getAudioCtx()
    const now = ctx.currentTime
    const beeps = 8
    const beepDuration = 0.5
    const gap = 0.65

    for (let i = 0; i < beeps; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = i % 2 === 0 ? 960 : 720
      const t = now + i * gap
      gain.gain.setValueAtTime(1.2, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + beepDuration)
      osc.start(t)
      osc.stop(t + beepDuration)
    }
  } catch (e) {
    // Audio no disponible
  }
}

function AcceptModal({ order, onConfirm, onClose }) {
  const [minutes, setMinutes] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!minutes) return
    setLoading(true)
    await onConfirm(order.id, minutes)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-dark">¿Cuánto tardará el pedido?</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pedido #{order.order_number} · {order.profiles?.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {DELIVERY_TIMES.map((t) => (
            <button key={t} onClick={() => setMinutes(t)}
              className={`py-3 rounded-2xl text-sm font-bold transition-all
                ${minutes === t ? 'bg-green-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t}<span className="text-[10px] font-normal block leading-none">min</span>
            </button>
          ))}
        </div>

        {minutes && (
          <div className="bg-green-50 rounded-2xl p-3 text-center text-sm text-green-700 font-medium">
            El cliente verá: <span className="font-bold">~{minutes} minutos</span> de espera
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={!minutes || loading}
            className="flex-1 py-2.5 rounded-2xl bg-green-500 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1">
            {loading ? <Spinner size="sm" /> : <><CheckCircle size={14} /> Aceptar pedido</>}
          </button>
        </div>
      </div>
    </div>
  )
}

const REJECT_REASONS = [
  'Muchos pedidos en este momento',
  'Sin ingredientes disponibles',
  'Restaurante cerrando pronto',
  'Dirección fuera de zona de entrega',
  'Otros',
]

function RejectModal({ order, onConfirm, onClose }) {
  const [selected, setSelected] = useState('')
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)

  const reason = selected === 'Otros' ? custom.trim() : selected
  const canConfirm = selected && (selected !== 'Otros' || custom.trim().length > 0)

  const handleConfirm = async () => {
    if (!canConfirm) return
    setLoading(true)
    await onConfirm(order.id, reason)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
        {/* Header fijo */}
        <div className="flex items-start justify-between p-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-dark">¿Por qué rechazas el pedido?</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pedido #{order.order_number} · {order.profiles?.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto px-5 space-y-2 flex-1">
          {REJECT_REASONS.map((r) => (
            <button key={r} onClick={() => setSelected(r)}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium border transition-all
                ${selected === r ? 'bg-red-50 border-red-400 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
              <span className={`inline-block w-4 h-4 rounded-full border-2 mr-2 align-middle flex-shrink-0
                ${selected === r ? 'border-red-500 bg-red-500' : 'border-gray-300'}`} />
              {r}
            </button>
          ))}

          {selected === 'Otros' && (
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Escribe el motivo del rechazo..."
              rows={3}
              maxLength={200}
              autoFocus
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none placeholder:text-gray-400"
            />
          )}
        </div>

        {/* Botones fijos abajo */}
        <div className="flex gap-2 p-5 pt-3 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={!canConfirm || loading}
            className="flex-1 py-2.5 rounded-2xl bg-red-500 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1">
            {loading ? <Spinner size="sm" /> : <><XCircle size={14} /> Rechazar pedido</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function LowBalanceModal({ balance, onClose }) {
  const msg = `Hola MenuPago, soy el restaurante ${balance !== null ? `con saldo Bs ${Number(balance).toFixed(2)}` : ''} y necesito recargar mi saldo de consumo para poder abrir.`
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div>
          <h2 className="text-lg font-bold text-dark">Saldo insuficiente</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tu saldo de consumo disponible es de{' '}
            <span className="font-bold text-red-500">{APP_CONFIG.currency} {Number(balance ?? 0).toFixed(2)}</span>.
            Necesitas al menos <span className="font-bold">{APP_CONFIG.currency} {APP_CONFIG.minConsumptionBalance}</span> para activar tu local.
          </p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3 text-sm text-gray-600">
          Contáctate con <span className="font-semibold text-dark">MenuPago</span> para recargar tu saldo y volver a recibir pedidos.
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">
            Cerrar
          </button>
          <a href={buildWhatsAppLink(msg)} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-2xl bg-green-500 text-white text-sm font-bold text-center hover:bg-green-600">
            Contactar MenuPago
          </a>
        </div>
      </div>
    </div>
  )
}

export default function RestaurantOrders() {
  const { profile, logout } = useStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [isOpen, setIsOpen] = useState(null)
  const [restaurantSchedule, setRestaurantSchedule] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [consumptionBalance, setConsumptionBalance] = useState(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantMaps, setRestaurantMaps] = useState('')
  const [deliveryCompanies, setDeliveryCompanies] = useState([])
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false)
  const [rejectOrder, setRejectOrder] = useState(null)
  const [acceptOrder, setAcceptOrder] = useState(null)
  const prevPendingCount = useRef(null)

  const lowBalance = consumptionBalance !== null && consumptionBalance < APP_CONFIG.minConsumptionBalance

  useEffect(() => {
    const unlock = () => { try { getAudioCtx() } catch (e) {} }
    window.addEventListener('touchstart', unlock, { once: true })
    window.addEventListener('click', unlock, { once: true })
    return () => {
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('click', unlock)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const pendingCount = orders.filter((o) => o.status === 'pending').length
      if (pendingCount > 0) playOrderAlert()
    }, 30000)
    return () => clearInterval(interval)
  }, [orders])


  const toggleOpen = async () => {
    if (lowBalance && !isOpen) {
      setShowLowBalanceModal(true)
      return
    }
    setToggling(true)
    const { data, error } = await supabase.rpc('toggle_restaurant_open')
    if (!error) setIsOpen(data)
    setToggling(false)
  }

  useEffect(() => {
    if (!profile?.restaurant_id) return
    const fetch = async () => {
      const [{ data: ordersData }, { data: restData }, { data: deliveryData }] = await Promise.all([
        supabase.from('orders')
          .select('id, order_number, total, status, created_at, confirmed_at, items, notes, delivery_location, rejection_reason, estimated_minutes, user_id, pickup, profiles(full_name, phone)')
          .eq('restaurant_id', profile.restaurant_id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('restaurants')
          .select('name, is_open, consumption_balance, schedule, maps')
          .eq('id', profile.restaurant_id)
          .single(),
        supabase.from('delivery_companies').select('*').order('name'),
      ])
      const pendingCount = (ordersData || []).filter((o) => o.status === 'pending').length
      if (prevPendingCount.current !== null && pendingCount > prevPendingCount.current) {
        playOrderAlert()
      }
      prevPendingCount.current = pendingCount

      setOrders(ordersData || [])
      if (restData) {
        setRestaurantName(restData.name || '')
        setRestaurantMaps(restData.maps || '')
        setIsOpen(restData.is_open)
        setRestaurantSchedule(restData.schedule || null)
        setConsumptionBalance(Number(restData.consumption_balance ?? 0))
      }
      setDeliveryCompanies(deliveryData || [])
      setLoading(false)
    }
    fetch()

    const channel = supabase.channel('restaurant-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${profile.restaurant_id}` },
        () => fetch()
      ).subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile?.restaurant_id])

  const [copiedId, setCopiedId] = useState(null)

  const copyOrderData = (order) => {
    const lines = [`📦 Pedido #${order.order_number}`]
    if (order.profiles?.full_name) lines.push(`👤 ${order.profiles.full_name}`)
    if (order.profiles?.phone) lines.push(`📱 ${order.profiles.phone}`)
    if (order.delivery_location?.name) {
      const loc = order.delivery_location.maps_url
        ? `📍 ${order.delivery_location.name} — ${order.delivery_location.maps_url}`
        : `📍 ${order.delivery_location.name}`
      lines.push(loc)
    }
    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedId(order.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const updateStatus = async (orderId, status) => {
    if (status === 'rejected') {
      await supabase.rpc('refund_order', { order_id: orderId })
    }
    const extra = status === 'preparing' ? { confirmed_at: new Date().toISOString() } : {}
    await supabase.from('orders').update({ status, ...extra }).eq('id', orderId)
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status, ...extra } : o))
  }

  const handleAccept = async (orderId, minutes) => {
    await supabase.from('orders').update({ status: 'confirmed', estimated_minutes: minutes }).eq('id', orderId)
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'confirmed', estimated_minutes: minutes } : o))
    setAcceptOrder(null)
  }

  const handleReject = async (orderId, reason) => {
    await supabase.rpc('refund_order', { order_id: orderId })
    await supabase.from('orders').update({ status: 'rejected', rejection_reason: reason }).eq('id', orderId)
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'rejected', rejection_reason: reason } : o))
    setRejectOrder(null)
  }

  const getDeliveryWALink = (company, order) => {
    const clean = (company.whatsapp || '').replace(/\D/g, '')
    if (!clean) return null
    const items = (order.items || []).map((i) => `   ${i.quantity}x ${i.name}  —  ${APP_CONFIG.currency} ${(i.unit_price * i.quantity).toFixed(2)}`).join('\n')
    const clientName = order.profiles?.full_name || ''
    const clientPhone = order.profiles?.phone ? `📱 Tel: ${order.profiles.phone}` : ''
    const deliveryAddr = order.delivery_location?.name
      ? `📍 Entrega: ${order.delivery_location.name}${order.delivery_location.maps_url ? `\n${order.delivery_location.maps_url}` : ''}`
      : ''
    const msg = [
      `🍽️ *MENUPAGO*`,
      `🏪 *${restaurantName}*`,
      restaurantMaps ? `📍 ${restaurantMaps}` : '',
      `━━━━━━━━━━━━━━━━━━━━`,
      `📦 *Pedido #${order.order_number}*`,
      clientName ? `👤 Cliente: ${clientName}` : '',
      clientPhone,
      deliveryAddr,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🛒 *Productos:*`,
      items,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 *Total: ${APP_CONFIG.currency} ${Number(order.total).toFixed(2)}*`,
      order.notes ? `📝 Nota: ${order.notes}` : '',
    ].filter(Boolean).join('\n')
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`
  }

  const pickupReadyWALink = (order) => {
    const phone = (order.profiles?.phone || '').replace(/\D/g, '')
    if (!phone) return null
    const msg = `¡Hola ${order.profiles?.full_name || ''}! 👋 Tu pedido #${order.order_number} en *${restaurantName}* está *listo para recoger* 🎉 ¡Te esperamos!`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  const filtered = orders.filter((o) => {
    if (tab === 'pending') return o.status === 'pending'
    if (tab === 'active') return ['confirmed', 'preparing', 'waiting_delivery', 'on_the_way'].includes(o.status)
    return ['completed', 'rejected'].includes(o.status)
  })

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white px-4 pt-14 pb-0 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div>
            {restaurantName && <p className="text-[11px] text-primary-500 font-semibold">{restaurantName}</p>}
            <h1 className="text-xl font-bold text-dark leading-tight">Pedidos</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOpen !== null && (() => {
              const effectiveOpen = !lowBalance && isRestaurantOpen({ is_open: isOpen, schedule: restaurantSchedule })
              return (
                <div className="flex flex-col items-end gap-0.5">
                  <button onClick={toggleOpen} disabled={toggling || lowBalance}
                    title={lowBalance ? `Saldo insuficiente (mín. ${APP_CONFIG.currency} ${APP_CONFIG.minConsumptionBalance})` : restaurantSchedule ? 'El horario controla la apertura. Toca para cerrar de emergencia.' : undefined}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-60
                      ${lowBalance ? 'bg-red-100 text-red-600 cursor-not-allowed' : effectiveOpen ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                    <span className={`w-2 h-2 rounded-full ${effectiveOpen ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                    {toggling ? '...' : lowBalance ? 'Cerrado' : effectiveOpen ? 'Abierto' : 'Cerrado'}
                  </button>
                  {restaurantSchedule && !lowBalance && (
                    <p className="text-[9px] text-gray-400 font-medium">según horario</p>
                  )}
                  {lowBalance && (
                    <p className="text-[9px] text-red-500 font-medium">Saldo bajo · {APP_CONFIG.currency} {consumptionBalance.toFixed(2)}</p>
                  )}
                </div>
              )
            })()}
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500">Salir</button>
          </div>
        </div>
        <div className="flex border-b border-gray-100">
          {[['pending','Nuevos'], ['active','En curso'], ['done','Historial']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${tab === key ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-400'}`}>
              {label}
              {key === 'pending' && orders.filter((o) => o.status === 'pending').length > 0 && (
                <span className="ml-1 bg-primary-500 text-white text-[9px] rounded-full px-1.5 py-0.5">
                  {orders.filter((o) => o.status === 'pending').length}
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
            <Clock size={40} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Sin pedidos en esta sección</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                        #{order.order_number}
                      </span>
                      <p className="font-semibold text-dark text-sm">{order.profiles?.full_name}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="space-y-0.5 border-t border-gray-100 pt-2">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{APP_CONFIG.currency} {(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <span className="font-bold text-dark text-sm">{APP_CONFIG.currency} {Number(order.total).toFixed(2)}</span>
                  {order.notes && <span className="text-xs text-gray-400 italic">"{order.notes}"</span>}
                </div>
                {!!(order.delivery_location?.pickup) ? (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                    <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      🏃 A recoger en local
                    </span>
                    {order.profiles?.phone && (
                      ['preparing', 'waiting_delivery'].includes(order.status) && pickupReadyWALink(order) ? (
                        <a href={pickupReadyWALink(order)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs font-semibold text-green-700">
                          <MessageCircle size={13} /> {order.profiles.phone} · Avisar que está listo
                        </a>
                      ) : (
                        <p className="text-xs text-gray-500">📱 {order.profiles.phone}</p>
                      )
                    )}
                  </div>
                ) : order.delivery_location ? (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
                    <MapPin size={13} className="text-primary-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-dark">{order.delivery_location.name}</span>
                    {order.delivery_location.maps_url && (
                      <a href={order.delivery_location.maps_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary-500 underline ml-1">Ver mapa</a>
                    )}
                  </div>
                ) : null}
                {order.confirmed_at && order.estimated_minutes && ['confirmed', 'preparing', 'waiting_delivery'].includes(order.status) && (
                  <CountdownTimer confirmedAt={order.confirmed_at} estimatedMinutes={order.estimated_minutes} />
                )}
                <button
                  onClick={() => copyOrderData(order)}
                  className={`w-full mt-2 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all
                    ${copiedId === order.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {copiedId === order.id
                    ? <><ClipboardCheck size={13} /> ¡Copiado!</>
                    : <><Copy size={13} /> Copiar datos del cliente</>}
                </button>

                {order.rejection_reason && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-start gap-1.5">
                    <XCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-500 italic">{order.rejection_reason}</p>
                  </div>
                )}

                {order.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setAcceptOrder(order)}
                      className="flex-1 bg-green-500 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1">
                      <CheckCircle size={14} /> Aceptar
                    </button>
                    <button onClick={() => setRejectOrder(order)}
                      className="flex-1 bg-red-100 text-red-600 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1">
                      <XCircle size={14} /> Rechazar
                    </button>
                  </div>
                )}
                {['confirmed', 'preparing', 'waiting_delivery'].includes(order.status) && deliveryCompanies.length > 0 && !(order.delivery_location?.pickup) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">🛵 Pedir delivery</p>
                    <div className="flex flex-wrap gap-2">
                      {deliveryCompanies.map((company) => {
                        const link = getDeliveryWALink(company, order)
                        if (!link) return null
                        return (
                          <a key={company.id} href={link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-2 rounded-xl">
                            <Bike size={12} /> {company.name}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
                {order.status === 'confirmed' && (
                  <button onClick={() => updateStatus(order.id, 'preparing')}
                    className="w-full mt-3 bg-orange-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1">
                    <ChefHat size={14} /> Empezar a preparar
                  </button>
                )}
                {order.status === 'preparing' && !(order.delivery_location?.pickup) && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateStatus(order.id, 'waiting_delivery')}
                      className="flex-1 bg-purple-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1">
                      <Bike size={14} /> Esperando delivery
                    </button>
                  </div>
                )}
                {order.status === 'preparing' && !!(order.delivery_location?.pickup) && (
                  <button onClick={() => updateStatus(order.id, 'waiting_delivery')}
                    className="w-full mt-3 bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Marcar como listo para recoger
                  </button>
                )}
                {order.status === 'waiting_delivery' && !(order.delivery_location?.pickup) && (
                  <button onClick={() => updateStatus(order.id, 'on_the_way')}
                    className="w-full mt-3 bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1">
                    <Navigation size={14} /> Delivery salió
                  </button>
                )}
                {order.status === 'waiting_delivery' && !!(order.delivery_location?.pickup) && (
                  <button onClick={() => updateStatus(order.id, 'completed')}
                    className="w-full mt-3 bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> El cliente ya recogió el pedido ✅
                  </button>
                )}
                {order.status === 'on_the_way' && (
                  <button onClick={() => updateStatus(order.id, 'completed')}
                    className="w-full mt-3 bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Pedido entregado
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {showLowBalanceModal && <LowBalanceModal balance={consumptionBalance} onClose={() => setShowLowBalanceModal(false)} />}
      {acceptOrder && <AcceptModal order={acceptOrder} onConfirm={handleAccept} onClose={() => setAcceptOrder(null)} />}
      {rejectOrder && <RejectModal order={rejectOrder} onConfirm={handleReject} onClose={() => setRejectOrder(null)} />}
    </div>
  )
}
