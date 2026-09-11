import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, Store, Receipt } from 'lucide-react'
import { supabase } from '../../config/supabase'
import Spinner from '../../components/Spinner'
import { APP_CONFIG } from '../../config/app.config'

const PERIODS = [
  { key: 'today',  label: 'Hoy' },
  { key: 'week',   label: 'Semana' },
  { key: 'month',  label: 'Mes' },
  { key: 'all',    label: 'Total' },
]

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

export default function AdminSales() {
  const [period, setPeriod] = useState('month')
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const start = getPeriodStart(period)

      let query = supabase
        .from('orders')
        .select('id, total, status, restaurant_id, created_at, items')
        .eq('status', 'completed')

      if (start) query = query.gte('created_at', start)

      const [{ data: ordersData }, { data: restaurantsData }] = await Promise.all([
        query,
        supabase.from('restaurants').select('id, name, category'),
      ])

      setOrders(ordersData || [])
      setRestaurants(restaurantsData || [])
      setLoading(false)
    }
    fetch()
  }, [period])

  // Métricas globales
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0)
  const totalOrders = orders.length
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Desglose por restaurante
  const byRestaurant = restaurants.map((r) => {
    const rOrders = orders.filter((o) => o.restaurant_id === r.id)
    const revenue = rOrders.reduce((s, o) => s + Number(o.total), 0)
    const count = rOrders.length
    const avg = count > 0 ? revenue / count : 0
    return { ...r, revenue, count, avg }
  }).filter((r) => r.count > 0).sort((a, b) => b.revenue - a.revenue)

  // Platos más vendidos (global)
  const itemMap = {}
  orders.forEach((o) => {
    ;(o.items || []).forEach((item) => {
      const key = item.name
      if (!itemMap[key]) itemMap[key] = { name: item.name, qty: 0, revenue: 0 }
      itemMap[key].qty += item.quantity
      itemMap[key].revenue += item.unit_price * item.quantity
    })
  })
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5)

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-dark to-gray-700 px-4 pt-14 pb-6">
        <h1 className="text-white text-xl font-bold mb-1">Ventas</h1>
        <p className="text-gray-400 text-xs">Resumen de ingresos por restaurante</p>

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
              ['Pedidos', totalOrders, ShoppingBag, 'text-blue-400'],
              ['Ticket prom.', `${APP_CONFIG.currency} ${avgTicket.toFixed(0)}`, Receipt, 'text-yellow-400'],
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
        ) : totalOrders === 0 ? (
          <div className="text-center py-16">
            <TrendingUp size={40} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Sin ventas en este período</p>
          </div>
        ) : (
          <>
            {/* Ranking de restaurantes */}
            <div>
              <h2 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                <Store size={15} className="text-primary-500" /> Ranking de restaurantes
              </h2>
              <div className="space-y-2">
                {byRestaurant.map((r, i) => {
                  const pct = totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0
                  return (
                    <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                            ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-500'}`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-dark text-sm">{r.name}</p>
                            <p className="text-gray-400 text-[10px]">{r.count} pedido{r.count !== 1 ? 's' : ''} · prom. {APP_CONFIG.currency} {r.avg.toFixed(0)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-dark text-sm">{APP_CONFIG.currency} {r.revenue.toFixed(2)}</p>
                          <p className="text-primary-500 text-[10px] font-semibold">{pct.toFixed(0)}% del total</p>
                        </div>
                      </div>
                      {/* Barra de progreso */}
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Platos más vendidos */}
            {topItems.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                  <ShoppingBag size={15} className="text-primary-500" /> Platos más pedidos
                </h2>
                <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
                  {topItems.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-300">#{i + 1}</span>
                        <p className="text-sm font-medium text-dark">{item.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-dark">{item.qty} unidades</p>
                        <p className="text-[10px] text-gray-400">{APP_CONFIG.currency} {item.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
