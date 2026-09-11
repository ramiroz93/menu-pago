import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Sparkles, XCircle, Clock, ShoppingCart, ChevronRight } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import Spinner from '../../components/Spinner'
import { APP_CONFIG } from '../../config/app.config'
import CountdownTimer from '../../components/CountdownTimer'

// ── Animaciones CSS globales (se inyectan una vez) ──────────────────
const ANIM_CSS = `
@keyframes mp-pulse   { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.5);opacity:0} }
@keyframes mp-pop     { from{transform:scale(0)} to{transform:scale(1)} }
@keyframes mp-draw    { to{stroke-dashoffset:0} }
@keyframes mp-sp      { from{opacity:1;transform:translate(0,0) scale(1)} to{opacity:0;transform:var(--t) scale(.3)} }
@keyframes mp-steam   { 0%{opacity:0;transform:translateY(0) scaleX(1)} 20%{opacity:.7} 80%{opacity:.2} 100%{opacity:0;transform:translateY(-36px) scaleX(1.8)} }
@keyframes mp-rock    { 0%,100%{transform:rotate(0)} 30%{transform:rotate(-2deg)} 70%{transform:rotate(2deg)} }
@keyframes mp-ripple  { 0%{width:44px;height:44px;opacity:.7} 100%{width:120px;height:120px;opacity:0} }
@keyframes mp-bob     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes mp-ride    { 0%{left:-52px;opacity:0} 10%{opacity:1} 88%{opacity:1} 100%{left:calc(100% + 20px);opacity:0} }
@keyframes mp-dash    { to{transform:translateX(-50%)} }
@keyframes mp-dot     { 0%,80%,100%{transform:scale(.5);opacity:.4} 40%{transform:scale(1);opacity:1} }
`

const STATUS_META = {
  pending:          { step: 0, title: 'Esperando confirmación', sub: 'El restaurante aún no confirmó tu pedido.' },
  confirmed:        { step: 1, title: '¡Pedido confirmado!',    sub: 'El restaurante aceptó tu pedido.' },
  preparing:        { step: 2, title: 'Preparando tu pedido',   sub: 'El restaurante está cocinando.' },
  waiting_delivery: { step: 3, title: 'Buscando repartidor',    sub: 'Tu pedido está listo, asignando delivery.' },
  on_the_way:       { step: 4, title: '¡Va en camino!',         sub: 'El repartidor ya salió con tu pedido.' },
}
const STEPS = ['Enviado', 'Confirm.', 'Preparando', 'Delivery', 'En camino']

const PICKUP_STATUS_META = {
  pending:          { step: 0, title: 'Esperando confirmación', sub: 'El restaurante aún no confirmó tu pedido.' },
  confirmed:        { step: 1, title: '¡Pedido confirmado!',    sub: 'El restaurante aceptó tu pedido.' },
  preparing:        { step: 2, title: 'Preparando tu pedido',   sub: 'El restaurante está cocinando.' },
  waiting_delivery: { step: 3, title: '¡Listo para recoger!',  sub: '¡Tu pedido ya está listo! Pasa a buscarlo.' },
}
const PICKUP_STEPS = ['Enviado', 'Confirm.', 'Preparando', '¡Listo!']

// ── Animación: Reloj (pending) ──────────────────────────────────────
function AnimClock() {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,107,53,.15)', animation: 'mp-pulse 2s ease-out infinite' }} />
      <svg width="90" height="90" viewBox="0 0 100 100" style={{ position: 'relative', zIndex: 1 }}>
        <circle cx="50" cy="50" r="44" fill="#fff4ef" stroke="#FF6B35" strokeWidth="3" />
        {[0,90,180,270].map(a => (
          <line key={a} x1="50" y1="10" x2="50" y2="17" stroke="#FF6B35" strokeWidth="2" opacity=".4"
            transform={`rotate(${a} 50 50)`} />
        ))}
        <line x1="50" y1="50" x2="50" y2="30" stroke="#FF6B35" strokeWidth="3.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="48s" repeatCount="indefinite" />
        </line>
        <line x1="50" y1="50" x2="50" y2="16" stroke="#e84e15" strokeWidth="2.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="4s" repeatCount="indefinite" />
        </line>
        <circle cx="50" cy="50" r="4" fill="#FF6B35" />
      </svg>
    </div>
  )
}

// ── Animación: Check (confirmed) ────────────────────────────────────
function AnimCheck() {
  const sparks = [
    { t: 'translate(-60px,-50px)' }, { t: 'translate(60px,-50px)' },
    { t: 'translate(70px,20px)'  }, { t: 'translate(-70px,20px)' },
    { t: 'translate(0,72px)'     }, { t: 'translate(-28px,-76px)' }, { t: 'translate(28px,-76px)' },
  ]
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {sparks.map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: '#FF6B35', '--t': s.t, animation: 'mp-sp .65s .5s cubic-bezier(.2,.8,.3,1) both' }} />
      ))}
      <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'mp-pop .5s cubic-bezier(.34,1.56,.64,1) both', position: 'relative', zIndex: 2 }}>
        <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
          <path d="M9 23 L19 34 L37 13" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 80, strokeDashoffset: 80, animation: 'mp-draw .55s .35s ease forwards' }} />
        </svg>
      </div>
    </div>
  )
}

// ── Animación: Olla con vapor (preparing) ───────────────────────────
function AnimPot() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 14, height: 44, alignItems: 'flex-end', marginBottom: 2 }}>
        {[0, .65, 1.3].map((delay, i) => (
          <svg key={i} width="14" height="40" viewBox="0 0 14 40" style={{ animation: `mp-steam 1.9s ease-in-out ${delay}s infinite`, opacity: 0 }}>
            <path d={i % 2 === 0 ? 'M7 40 Q0 30 7 20 Q14 10 7 0' : 'M7 40 Q14 30 7 20 Q0 10 7 0'}
              stroke="#FF6B35" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        ))}
      </div>
      <svg width="92" height="72" viewBox="0 0 96 74" style={{ animation: 'mp-rock 2.5s ease-in-out infinite' }}>
        <rect x="4"  y="18" width="11" height="7" rx="3.5" fill="#e84e15" />
        <rect x="81" y="18" width="11" height="7" rx="3.5" fill="#e84e15" />
        <rect x="17" y="11" width="62" height="10" rx="5" fill="#FF6B35" />
        <rect x="40" y="5"  width="16" height="9"  rx="4.5" fill="#e84e15" />
        <path d="M16 21 L20 68 Q20 72 24 72 L72 72 Q76 72 76 68 L80 21 Z" fill="#FF6B35" />
        <path d="M28 32 Q30 27 34 32 Q36 37 34 42" stroke="rgba(255,255,255,.35)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// ── Animación: Pin con ondas (waiting_delivery) ──────────────────────
function AnimPin() {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {[0, .65, 1.3].map((d, i) => (
        <div key={i} style={{ position: 'absolute', border: '2px solid #FF6B35', borderRadius: '50%', animation: `mp-ripple 2s ease-out ${d}s infinite`, opacity: 0 }} />
      ))}
      <svg width="46" height="62" viewBox="0 0 46 62" style={{ position: 'relative', zIndex: 2, animation: 'mp-bob 1.8s ease-in-out infinite' }}>
        <path d="M23 0 C10.3 0 0 10.3 0 23 C0 40.2 23 62 23 62 C23 62 46 40.2 46 23 C46 10.3 35.7 0 23 0Z" fill="#FF6B35" />
        <circle cx="23" cy="23" r="10" fill="white" />
        <circle cx="23" cy="23" r="5.5" fill="#FF6B35" />
      </svg>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {[0, .2, .4].map((d, i) => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF6B35', animation: `mp-dot 1.2s ease-in-out ${d}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

// ── Animación: Scooter (on_the_way) ─────────────────────────────────
function AnimScooter() {
  const dashes = Array.from({ length: 22 })
  return (
    <div style={{ width: 270, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', height: 56, width: '100%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', fontSize: 32, top: 10, animation: 'mp-ride 2.6s linear infinite' }}>🛵</div>
      </div>
      <div style={{ width: '100%', height: 32, background: '#555', borderRadius: 5, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14, width: '200%', animation: 'mp-dash .7s linear infinite' }}>
          {dashes.map((_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 26, height: 3, background: 'rgba(255,255,255,.5)', borderRadius: 2 }} />
          ))}
        </div>
        <div style={{ position: 'absolute', right: 10, fontSize: 18 }}>🏠</div>
      </div>
      <p style={{ fontSize: 10, color: '#aaa', fontWeight: 600, letterSpacing: '.04em' }}>Tu pedido está llegando</p>
    </div>
  )
}

function AnimPickupReady() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 88, height: 88, borderRadius: '50%', background: 'rgba(59,130,246,.18)', animation: 'mp-pulse 2s ease-out infinite' }} />
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, animation: 'mp-bob 2s ease-in-out infinite' }}>
          <span style={{ fontSize: 44 }}>🛍️</span>
        </div>
      </div>
    </div>
  )
}

const ANIM_MAP = {
  pending:          <AnimClock />,
  confirmed:        <AnimCheck />,
  preparing:        <AnimPot />,
  waiting_delivery: <AnimPin />,
  on_the_way:       <AnimScooter />,
}

const PICKUP_ANIM_MAP = {
  pending:          <AnimClock />,
  confirmed:        <AnimCheck />,
  preparing:        <AnimPot />,
  waiting_delivery: <AnimPickupReady />,
}

// ── Stepper de 5 pasos ───────────────────────────────────────────────
function StatusStepper({ status, pickup }) {
  const meta = pickup ? PICKUP_STATUS_META : STATUS_META
  const steps = pickup ? PICKUP_STEPS : STEPS
  const activeStep = meta[status]?.step ?? 0
  return (
    <div className="flex items-start px-1 pt-1">
      {steps.map((label, i) => (
        <div key={i} className="flex flex-col items-center flex-1 relative">
          {i > 0 && (
            <div className="absolute top-[10px] right-1/2 left-[-50%] h-0.5"
              style={{ background: i <= activeStep ? '#FF6B35' : '#e0d8d4' }} />
          )}
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold relative z-10 transition-all"
            style={{
              background: i < activeStep ? '#FF6B35' : i === activeStep ? '#FF6B35' : '#e0d8d4',
              color: i <= activeStep ? 'white' : '#aaa',
              boxShadow: i === activeStep ? '0 0 0 3px rgba(255,107,53,.2)' : 'none',
              transform: i === activeStep ? 'scale(1.15)' : 'scale(1)',
            }}>
            {i < activeStep ? '✓' : i + 1}
          </div>
          <p className="text-[8px] font-semibold mt-1 text-center leading-tight"
            style={{ color: i <= activeStep ? '#FF6B35' : '#bbb' }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Tarjeta de pedido ACTIVO (con animación) ─────────────────────────
function ActiveOrderCard({ order }) {
  const isPickup = !!(order.delivery_location?.pickup)
  const metaMap = isPickup ? PICKUP_STATUS_META : STATUS_META
  const animMap = isPickup ? PICKUP_ANIM_MAP : ANIM_MAP
  const meta = metaMap[order.status] || metaMap.pending
  const anim = animMap[order.status] || animMap.pending

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-primary-100">
      {/* Header restaurante */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <p className="font-bold text-dark text-sm">{order.restaurants?.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {order.order_number && <span className="text-[10px] text-gray-400 font-semibold">#{order.order_number}</span>}
            {isPickup && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">🏃 Recoger en local</span>}
            <span className="text-[10px] text-gray-400">·</span>
            <span className="text-[10px] text-gray-400">
              {new Date(order.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mt-1" />
      </div>

      {/* Dirección del restaurante (pickup) — siempre visible */}
      {isPickup && (
        <div className="mx-4 mb-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-base flex-shrink-0">📍</span>
          <div className="flex-1 min-w-0">
            {order.restaurants?.address && (
              <p className="text-[11px] text-blue-600 font-semibold truncate">{order.restaurants.address}</p>
            )}
          </div>
          {order.restaurants?.maps && (
            <a href={order.restaurants.maps} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 text-[11px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg whitespace-nowrap">
              Google Maps →
            </a>
          )}
        </div>
      )}

      {/* Animación */}
      <div className="flex flex-col items-center justify-center py-5 px-4" style={{ minHeight: 160 }}>
        {anim}
        <div className="mt-4 text-center">
          <p className="font-bold text-dark text-sm">{meta.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{meta.sub}</p>
        </div>
      </div>

      {/* Countdown */}
      {order.confirmed_at && order.estimated_minutes && (
        <div className="mx-4 mb-3">
          <CountdownTimer confirmedAt={order.confirmed_at} estimatedMinutes={order.estimated_minutes} />
        </div>
      )}

      {/* Stepper */}
      <div className="px-4 pb-3">
        <StatusStepper status={order.status} pickup={isPickup} />
      </div>

      {/* Detalle del pedido */}
      <div className="border-t border-gray-100 px-4 pt-3 pb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Tu pedido</p>
        {(order.items || []).map((item, i) => {
          const discountedLine = item.unit_price * item.quantity
          const originalLine   = discountedLine / (1 - APP_CONFIG.discount)
          return (
            <div key={i} className="flex justify-between items-center text-xs text-gray-600 py-0.5">
              <span>{item.quantity}x {item.name}</span>
              <div className="text-right">
                <p className="text-gray-300 line-through text-[10px]">{APP_CONFIG.currency} {originalLine.toFixed(2)}</p>
                <p className="font-semibold text-primary-500">{APP_CONFIG.currency} {discountedLine.toFixed(2)}</p>
              </div>
            </div>
          )
        })}
        {order.notes && (
          <p className="text-[11px] text-gray-400 italic mt-2 bg-gray-50 rounded-lg px-2 py-1.5">
            📝 {order.notes}
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400">Total pagado</p>
          {order.user_balance_before != null && (
            <p className="text-[10px] text-gray-400">Saldo anterior: {APP_CONFIG.currency} {Number(order.user_balance_before).toFixed(2)}</p>
          )}
        </div>
        <span className="font-black text-dark text-base">{APP_CONFIG.currency} {Number(order.total).toFixed(2)}</span>
      </div>
    </div>
  )
}

// ── Tarjeta de pedido PASADO (compacta) ──────────────────────────────
function PastOrderCard({ order }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-dark text-sm">{order.restaurants?.name}</p>
            {order.order_number && <span className="text-[10px] text-gray-400 font-semibold">#{order.order_number}</span>}
          </div>
          <p className="text-xs text-gray-400">
            {new Date(order.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <OrderStatusBadge status={order.status} />
          {order.delivery_location?.pickup && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">🏃 Recogido</span>}
        </div>
      </div>
      <div className="border-t border-gray-100 pt-2 mt-2">
        {(order.items || []).map((item, i) => {
          const discountedLine = item.unit_price * item.quantity
          const originalLine   = discountedLine / (1 - APP_CONFIG.discount)
          return (
            <div key={i} className="flex justify-between items-center text-xs text-gray-500 py-0.5">
              <span>{item.quantity}x {item.name}</span>
              <div className="text-right">
                <p className="text-gray-300 line-through text-[10px]">{APP_CONFIG.currency} {originalLine.toFixed(2)}</p>
                <p className="font-semibold text-primary-500">{APP_CONFIG.currency} {discountedLine.toFixed(2)}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">Total</span>
        <span className="font-bold text-dark text-sm">{APP_CONFIG.currency} {Number(order.total).toFixed(2)}</span>
      </div>
      {order.status === 'completed' && (
        <div className="flex items-center justify-end gap-1 mt-1">
          <Sparkles size={11} className="text-green-500" />
          <span className="text-[11px] text-green-600 font-semibold">
            Ahorraste {APP_CONFIG.currency} {(Number(order.total) * (APP_CONFIG.discount / (1 - APP_CONFIG.discount))).toFixed(2)}
          </span>
        </div>
      )}
      {order.status === 'rejected' && order.rejection_reason && (
        <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-red-100">
          <XCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-500">Motivo: {order.rejection_reason}</p>
        </div>
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────
export default function MyOrders() {
  const navigate = useNavigate()
  const { profile, cart, cartRestaurantId, menuCache } = useStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingsModal, setSavingsModal] = useState(null) // { total, restaurantName }

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at, confirmed_at, items, notes, rejection_reason, estimated_minutes, user_balance_before, delivery_location, restaurants(name, address, maps)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(30)
      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()

    const channel = supabase.channel('my-orders')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          if (payload.new?.status === 'completed' && payload.old?.status !== 'completed') {
            // Buscar nombre del restaurante en los orders ya cargados
            setOrders((prev) => {
              const found = prev.find((o) => o.id === payload.new.id)
              setSavingsModal({
                total: payload.new.total,
                restaurantName: found?.restaurants?.name || '',
                orderNumber: payload.new.order_number,
              })
              return prev
            })
          }
          fetchOrders()
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `user_id=eq.${profile.id}` },
        () => fetchOrders()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile.id])

  const ACTIVE = ['pending', 'confirmed', 'preparing', 'waiting_delivery', 'on_the_way']
  const active = orders.filter((o) => ACTIVE.includes(o.status))
  const past   = orders.filter((o) => !ACTIVE.includes(o.status))

  return (
    <div className="flex flex-col min-h-full">
      {/* Inyectar CSS de animaciones */}
      <style>{ANIM_CSS}</style>

      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-dark">Mis pedidos</h1>
          <div className="bg-primary-50 border border-primary-100 rounded-xl px-3 py-1.5 text-center">
            <p className="text-[10px] text-primary-600 font-medium">Saldo</p>
            <p className="text-primary-700 font-bold text-sm">{APP_CONFIG.currency} {Number(profile?.wallet_balance || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {/* Carrito sin confirmar */}
        {cart.length > 0 && cartRestaurantId && (
          <button onClick={() => navigate(`/app/restaurante/${cartRestaurantId}`)}
            className="w-full bg-white rounded-2xl shadow-sm p-4 text-left border-2 border-primary-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                  <ShoppingCart size={14} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary-600 uppercase tracking-wide">Carrito sin confirmar</p>
                  <p className="text-sm font-semibold text-dark">{menuCache[cartRestaurantId]?.restaurant?.name || 'Restaurante'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary-500">
                <span className="text-xs font-semibold">Ver pedido</span>
                <ChevronRight size={14} />
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-500 py-0.5">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{APP_CONFIG.currency} {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
              <div>
                <span className="text-xs text-gray-500">Total con 15% desc.</span>
                <p className="text-[10px] text-gray-400 line-through">
                  {APP_CONFIG.currency} {cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                </p>
              </div>
              <span className="font-bold text-primary-600 text-sm">
                {APP_CONFIG.currency} {(cart.reduce((s, i) => s + i.price * i.quantity, 0) * (1 - APP_CONFIG.discount)).toFixed(2)}
              </span>
            </div>
          </button>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : orders.length === 0 && cart.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aún no tienes pedidos</p>
          </div>
        ) : (
          <>
            {/* Pedidos activos con animación */}
            {active.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-dark">Pedidos en curso</h2>
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{active.length}</span>
                </div>
                <div className="space-y-4">
                  {active.map((order) => <ActiveOrderCard key={order.id} order={order} />)}
                </div>
              </div>
            )}

            {/* Pedidos pasados compactos */}
            {past.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pedidos anteriores</h2>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-3">
                  {past.map((order) => <PastOrderCard key={order.id} order={order} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de ahorro al completar pedido */}
      {savingsModal && (() => {
        const total    = Number(savingsModal.total)
        const original = total / (1 - APP_CONFIG.discount)
        const saved    = original - total
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="bg-white rounded-3xl overflow-hidden w-full max-w-xs shadow-2xl">
              {/* Franja superior verde */}
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 px-6 pt-8 pb-12 flex flex-col items-center text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h2 className="text-white text-xl font-black">¡Pedido completado!</h2>
                {savingsModal.restaurantName && (
                  <p className="text-green-100 text-xs mt-1">{savingsModal.restaurantName}</p>
                )}
              </div>

              {/* Tarjeta de ahorro superpuesta */}
              <div className="px-5 pb-5 -mt-6 relative">
                <div className="bg-white rounded-2xl shadow-lg border border-green-100 px-5 py-4 flex flex-col items-center mb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={13} className="text-green-500" />
                    <p className="text-[11px] font-bold text-green-600 uppercase tracking-wide">Te ahorraste</p>
                    <Sparkles size={13} className="text-green-500" />
                  </div>
                  <p className="text-4xl font-black text-green-500 my-1">
                    {APP_CONFIG.currency} {saved.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-400 line-through">{APP_CONFIG.currency} {original.toFixed(2)}</p>
                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">-{Math.round(APP_CONFIG.discount * 100)}%</span>
                    <p className="text-xs font-bold text-dark">{APP_CONFIG.currency} {total.toFixed(2)}</p>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-400 mb-4 leading-relaxed">
                  ¡Gracias por usar Menu-Pago! Sigue pidiendo y ahorrando.
                </p>

                <button
                  onClick={() => setSavingsModal(null)}
                  className="w-full bg-green-500 text-white font-black py-3.5 rounded-2xl text-base"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
