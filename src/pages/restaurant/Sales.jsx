import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, Star, Wallet, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import Spinner from '../../components/Spinner'
import { APP_CONFIG } from '../../config/app.config'

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'all',   label: 'Total' },
]

const STATUS_LABELS = {
  pending:          { label: 'Nuevo',             color: 'bg-orange-100 text-orange-600' },
  confirmed:        { label: 'Confirmado',         color: 'bg-blue-100 text-blue-600' },
  preparing:        { label: 'Preparando',         color: 'bg-orange-100 text-orange-600' },
  waiting_delivery: { label: 'Esp. delivery',      color: 'bg-purple-100 text-purple-600' },
  on_the_way:       { label: 'En camino',          color: 'bg-indigo-100 text-indigo-600' },
  completed:        { label: 'Completado',         color: 'bg-green-100 text-green-600' },
}

function getPeriodStart(key) {
  const now = new Date()
  if (key === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  }
  if (key === 'week') {
    const d = new Date(now)
    d.setDate(now.getDate() - 6)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  if (key === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  }
  return null
}

export default function RestaurantSales() {
  const { profile } = useStore()
  const [period, setPeriod] = useState('month')
  const [completedOrders, setCompletedOrders] = useState([])   // para KPIs y platos más pedidos
  const [timelineOrders, setTimelineOrders] = useState([])     // para historial (todos menos rechazados)
  const [topUps, setTopUps] = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [consumptionBalance, setConsumptionBalance] = useState(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.restaurant_id) return
    const fetch = async () => {
      setLoading(true)
      const start = getPeriodStart(period)

      // KPIs: solo completados, filtrados por período
      let completedQ = supabase
        .from('orders')
        .select('id, order_number, total, items, created_at')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (start) completedQ = completedQ.gte('created_at', start)

      // Historial de saldo: pedidos activos SIN filtro de período (siempre visibles)
      // + completados dentro del período seleccionado
      const activeStatusQ = supabase
        .from('orders')
        .select('id, order_number, total, subtotal, items, created_at, status, balance_before')
        .eq('restaurant_id', profile.restaurant_id)
        .in('status', ['pending', 'confirmed', 'preparing', 'waiting_delivery', 'on_the_way'])
        .order('created_at', { ascending: false })

      let completedTimelineQ = supabase
        .from('orders')
        .select('id, order_number, total, subtotal, items, created_at, status, balance_before')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (start) completedTimelineQ = completedTimelineQ.gte('created_at', start)

      let topUpsQ = supabase
        .from('consumption_top_ups')
        .select('id, amount, note, created_at')
        .eq('restaurant_id', profile.restaurant_id)
        .order('created_at', { ascending: false })

      if (start) topUpsQ = topUpsQ.gte('created_at', start)

      const [
        { data: completedData },
        { data: activeData },
        { data: completedTimelineData },
        { data: topUpsData },
        { data: restData },
      ] = await Promise.all([
        completedQ,
        activeStatusQ,
        completedTimelineQ,
        topUpsQ,
        supabase.from('restaurants').select('name, rating, rating_count, consumption_balance').eq('id', profile.restaurant_id).single(),
      ])

      // Combinar activos + completados del período, sin duplicados
      const activeIds = new Set((activeData || []).map((o) => o.id))
      const timelineData = [
        ...(activeData || []),
        ...(completedTimelineData || []).filter((o) => !activeIds.has(o.id)),
      ]

      setCompletedOrders(completedData || [])
      setTimelineOrders(timelineData || [])
      setTopUps(topUpsData || [])
      setAvgRating(restData?.rating_count > 0 ? Number(restData.rating) : null)
      setConsumptionBalance(restData?.consumption_balance ?? null)
      setRestaurantName(restData?.name || '')
      setLoading(false)
    }
    fetch()
  }, [profile?.restaurant_id, period])

  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total), 0)
  const totalOrders  = completedOrders.length

  // Platos más vendidos (solo completados)
  const itemMap = {}
  completedOrders.forEach((o) => {
    ;(o.items || []).forEach((item) => {
      if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 }
      itemMap[item.name].qty += item.quantity
      itemMap[item.name].revenue += item.unit_price * item.quantity
    })
  })
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty)
  const maxQty   = topItems[0]?.qty || 1

  const hasActivity = timelineOrders.length > 0 || topUps.length > 0

  return (
    <div className="flex flex-col min-h-full">
      {/* Saldo en consumo */}
      {consumptionBalance !== null && (
        <div className={`mx-4 mt-14 mb-0 rounded-2xl p-4 flex items-center gap-3 ${consumptionBalance > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${consumptionBalance > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <Wallet size={20} className={consumptionBalance > 0 ? 'text-green-600' : 'text-red-500'} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Saldo en consumo disponible</p>
            <p className={`text-2xl font-bold leading-tight ${consumptionBalance > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {APP_CONFIG.currency} {Number(consumptionBalance).toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Se descuenta con cada pedido recibido</p>
          </div>
        </div>
      )}

      {/* Header con gradiente */}
      <div className={`bg-gradient-to-br from-dark to-gray-700 px-4 ${consumptionBalance !== null ? 'pt-4' : 'pt-14'} pb-6`}>
        {restaurantName && <p className="text-primary-300 text-[11px] font-semibold mb-0.5">{restaurantName}</p>}
        <h1 className="text-white text-xl font-bold mb-0.5">Mis ventas</h1>
        <p className="text-gray-400 text-xs">Ingresos de pedidos completados</p>

        {/* Period tabs */}
        <div className="flex gap-2 mt-4">
          {PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors ${period === key ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        {!loading && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              ['Ingresos', `${APP_CONFIG.currency} ${totalRevenue.toFixed(0)}`, TrendingUp, 'text-green-400'],
              ['Pedidos',  totalOrders,                                           ShoppingBag, 'text-blue-400'],
              ['Calific.', avgRating ? `★ ${avgRating.toFixed(1)}` : '—',        Star,        'text-yellow-400'],
            ].map(([label, value, Icon, color]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                <Icon size={14} className={`${color} mx-auto mb-1`} />
                <p className="text-white font-bold text-base leading-tight">{value}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !hasActivity ? (
          <div className="text-center py-16">
            <TrendingUp size={40} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Sin actividad en este período</p>
          </div>
        ) : (
          <>
            {/* Platos más vendidos */}
            {topItems.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                  <Star size={15} className="text-primary-500" /> Platos más pedidos
                </h2>
                <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
                  {topItems.map((item, i) => {
                    const pct = Math.round((item.qty / maxQty) * 100)
                    return (
                      <div key={item.name} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-300">#{i + 1}</span>
                            <p className="text-sm font-medium text-dark">{item.name}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-dark">{item.qty} uds.</span>
                            <span className="text-[10px] text-gray-400 ml-1">· {APP_CONFIG.currency} {item.revenue.toFixed(0)}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Historial unificado */}
            <div>
              <h2 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                <ShoppingBag size={15} className="text-primary-500" /> Historial de saldo
              </h2>
              {(() => {
                const events = [
                  ...timelineOrders.map((o) => ({ type: 'order', date: o.created_at, data: o })),
                  ...topUps.map((t) => ({ type: 'topup', date: t.created_at, data: t })),
                ].sort((a, b) => new Date(b.date) - new Date(a.date))

                return (
                  <div className="space-y-2">
                    {events.map((ev) => {
                      const dateStr = new Date(ev.date).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
                      const timeStr = new Date(ev.date).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })

                      if (ev.type === 'topup') {
                        const amount = Number(ev.data.amount)
                        return (
                          <div key={ev.data.id} className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <ArrowUpCircle size={16} className="text-green-500 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-green-700">Recarga de saldo</p>
                                  <p className="text-[10px] text-gray-400">{dateStr} · {timeStr}</p>
                                  {ev.data.note && <p className="text-[10px] text-gray-500 mt-0.5 italic">"{ev.data.note}"</p>}
                                </div>
                              </div>
                              <p className="font-bold text-green-600 text-sm flex-shrink-0 ml-3">+{APP_CONFIG.currency} {amount.toFixed(2)}</p>
                            </div>
                          </div>
                        )
                      }

                      const discountedTotal = Number(ev.data.total)
                      const fullTotal       = ev.data.subtotal ? Number(ev.data.subtotal) : discountedTotal / 0.85
                      const statusInfo      = STATUS_LABELS[ev.data.status] || { label: ev.data.status, color: 'bg-gray-100 text-gray-500' }
                      const isPending       = ev.data.status !== 'completed'

                      return (
                        <div key={ev.data.id} className={`rounded-xl shadow-sm p-3 ${isPending ? 'bg-orange-50 border border-orange-100' : 'bg-white'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isPending
                                ? <Clock size={16} className="text-orange-400 flex-shrink-0" />
                                : <ArrowDownCircle size={16} className="text-red-400 flex-shrink-0" />
                              }
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {ev.data.order_number && (
                                    <span className="bg-primary-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">
                                      #{ev.data.order_number}
                                    </span>
                                  )}
                                  <p className="text-xs font-medium text-dark">{dateStr} · {timeStr}</p>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                  {(ev.data.items || []).map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <p className="font-bold text-dark text-sm">{APP_CONFIG.currency} {discountedTotal.toFixed(2)}</p>
                              <p className="text-[10px] text-gray-400 line-through">{APP_CONFIG.currency} {fullTotal.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-100">
                            {ev.data.balance_before != null ? (
                              <div>
                                <span className="text-[10px] text-gray-400">Saldo anterior: </span>
                                <span className="text-[10px] font-semibold text-gray-600">{APP_CONFIG.currency} {Number(ev.data.balance_before).toFixed(2)}</span>
                              </div>
                            ) : <div />}
                            <div>
                              <span className="text-[10px] text-gray-400">Descontado: </span>
                              <span className="text-[10px] font-bold text-red-500">-{APP_CONFIG.currency} {fullTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
