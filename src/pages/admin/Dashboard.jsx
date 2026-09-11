import { useState, useEffect, useCallback } from 'react'
import { Wallet, ShoppingBag, Store, TrendingUp, LogOut, Calendar, Users, UserPlus, PiggyBank, ClipboardList } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import Spinner from '../../components/Spinner'
import { APP_CONFIG } from '../../config/app.config'

const PERIOD_OPTIONS = [
  { key: 'all', label: 'Total' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '90d', label: '90 días' },
  { key: 'custom', label: 'Rango' },
]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function toISO(dateStr) {
  return new Date(dateStr + 'T00:00:00').toISOString()
}

function endOfDay(dateStr) {
  return new Date(dateStr + 'T23:59:59').toISOString()
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoStr(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function AdminDashboard() {
  const { logout } = useStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState([])
  const [completedOrders, setCompletedOrders] = useState([])
  const [restaurantsList, setRestaurantsList] = useState([])
  const [period, setPeriod] = useState('7d')
  const [dateFrom, setDateFrom] = useState(daysAgoStr(7))
  const [dateTo, setDateTo] = useState(todayStr())
  const [activityTab, setActivityTab] = useState('actividad')

  const fetchData = useCallback(async () => {
    setLoading(true)

    let from = null, to = null
    if (period === '7d') { from = daysAgo(7) }
    else if (period === '30d') { from = daysAgo(30) }
    else if (period === '90d') { from = daysAgo(90) }
    else if (period === 'custom') { from = toISO(dateFrom); to = endOfDay(dateTo) }

    let recentQ = supabase
      .from('orders')
      .select('id, order_number, total, status, created_at, restaurants(name), profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(period === 'all' ? 200 : 50)
    if (from) recentQ = recentQ.gte('created_at', from)
    if (to) recentQ = recentQ.lte('created_at', to)

    let completedQ = supabase
      .from('orders')
      .select('total, restaurant_id, items')
      .eq('status', 'completed')
    if (from) completedQ = completedQ.gte('created_at', from)
    if (to) completedQ = completedQ.lte('created_at', to)

    let topUpsQ = supabase.from('top_up_requests').select('amount, status, created_at')
    if (from) topUpsQ = topUpsQ.gte('created_at', from)
    if (to) topUpsQ = topUpsQ.lte('created_at', to)

    let newUsersQ = supabase.from('profiles').select('id').eq('role', 'user')
    if (from) newUsersQ = newUsersQ.gte('created_at', from)
    if (to) newUsersQ = newUsersQ.lte('created_at', to)

    const [
      { data: orders },
      { data: completedOrders },
      { data: topUps },
      { data: restaurants },
      { data: totalUsers },
      { data: newUsers },
      { data: restaurantsData },
    ] = await Promise.all([
      recentQ,
      completedQ,
      topUpsQ,
      supabase.from('restaurants').select('id').eq('is_active', true),
      supabase.from('profiles').select('id').eq('role', 'user'),
      newUsersQ,
      supabase.from('restaurants').select('id, name'),
    ])

    const pendingTopUps = (topUps || []).filter((t) => t.status === 'pending')
    const approvedTopUps = (topUps || []).filter((t) => t.status === 'approved')

    setStats({
      pendingTopUps: pendingTopUps.length,
      pendingTopUpsAmount: pendingTopUps.reduce((s, t) => s + Number(t.amount), 0),
      totalDeposited: approvedTopUps.reduce((s, t) => s + Number(t.amount), 0),
      totalRevenue: (completedOrders || []).reduce((s, o) => s + Number(o.total), 0),
      totalSavings: (completedOrders || []).reduce((s, o) => s + Number(o.total) * (APP_CONFIG.discount / (1 - APP_CONFIG.discount)), 0),
      orderCount: (completedOrders || []).length,
      totalOrders: (orders || []).length,
      restaurants: restaurants?.length || 0,
      totalUsers: totalUsers?.length || 0,
      newUsers: newUsers?.length || 0,
    })
    setRecentOrders(orders || [])
    setCompletedOrders(completedOrders || [])
    setRestaurantsList(restaurantsData || [])
    setLoading(false)
  }, [period, dateFrom, dateTo])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-gradient-to-br from-dark to-gray-700 px-4 pt-14 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm">Panel de</p>
            <h1 className="text-white text-xl font-bold">Administrador</h1>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-white transition-colors"><LogOut size={18} /></button>
        </div>

        {/* Filtro de período */}
        <div className="flex gap-1.5 mt-4 mb-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => setPeriod(opt.key)}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${period === opt.key ? 'bg-white text-dark' : 'bg-white/10 text-gray-300'}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5 flex-1">
              <Calendar size={12} className="text-gray-400" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-white text-[11px] w-full outline-none" />
            </div>
            <span className="text-gray-400 text-xs">a</span>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5 flex-1">
              <Calendar size={12} className="text-gray-400" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-white text-[11px] w-full outline-none" />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              ['Total depositado', `${APP_CONFIG.currency} ${stats.totalDeposited.toFixed(2)}`, Wallet, 'text-emerald-400'],
              ['Ventas completadas', `${APP_CONFIG.currency} ${stats.totalRevenue.toFixed(2)}`, TrendingUp, 'text-green-400'],
              ['Ahorro total', `${APP_CONFIG.currency} ${stats.totalSavings.toFixed(2)}`, PiggyBank, 'text-pink-400'],
              ['Pedidos completados', stats.orderCount, ShoppingBag, 'text-blue-400'],
              ['Restaurantes', stats.restaurants, Store, 'text-yellow-400'],
              ['Usuarios totales', stats.totalUsers, Users, 'text-purple-400'],
              ['Usuarios nuevos', stats.newUsers, UserPlus, 'text-cyan-400'],
            ].map(([label, value, Icon, color]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
                <Icon size={16} className={color} />
                <p className="text-white font-bold text-lg mt-1">{value}</p>
                <p className="text-gray-400 text-xs">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-4">
        {/* Alerta recargas pendientes */}
        {stats && stats.pendingTopUps > 0 && (
          <a href="/admin/recargas" className="block bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-orange-500" />
              <div>
                <p className="text-orange-700 font-semibold text-sm">{stats.pendingTopUps} recarga{stats.pendingTopUps > 1 ? 's' : ''} pendiente{stats.pendingTopUps > 1 ? 's' : ''}</p>
                <p className="text-orange-500 text-xs">{APP_CONFIG.currency} {stats.pendingTopUpsAmount.toFixed(2)} por aprobar → Toca para revisar</p>
              </div>
            </div>
          </a>
        )}

        {/* Tabs actividad */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'actividad', label: 'Actividad', icon: ClipboardList },
            { key: 'restaurantes', label: 'Ranking', icon: Store },
            { key: 'platos', label: 'Platos', icon: ShoppingBag },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActivityTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${activityTab === key ? 'bg-white text-dark shadow-sm' : 'text-gray-400'}`}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Spinner size="lg" /></div>
        ) : activityTab === 'actividad' ? (
          recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Sin actividad en este período</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-xl shadow-sm p-3 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-dark">{o.profiles?.full_name}</p>
                      {o.order_number && <span className="text-[10px] text-gray-400 font-semibold">#{o.order_number}</span>}
                    </div>
                    <p className="text-xs text-gray-400">
                      {o.restaurants?.name} · {new Date(o.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })} {new Date(o.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark text-sm">{APP_CONFIG.currency} {Number(o.total).toFixed(2)}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      o.status === 'completed' ? 'bg-green-100 text-green-700' :
                      o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      o.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activityTab === 'restaurantes' ? (() => {
          const totalRev = completedOrders.reduce((s, o) => s + Number(o.total), 0)
          const byRestaurant = restaurantsList.map((r) => {
            const rOrders = completedOrders.filter((o) => o.restaurant_id === r.id)
            const revenue = rOrders.reduce((s, o) => s + Number(o.total), 0)
            const count = rOrders.length
            return { ...r, revenue, count, avg: count > 0 ? revenue / count : 0 }
          }).filter((r) => r.count > 0).sort((a, b) => b.revenue - a.revenue)
          return byRestaurant.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Sin ventas en este período</p>
          ) : (
            <div className="space-y-2">
              {byRestaurant.map((r, i) => {
                const pct = totalRev > 0 ? (r.revenue / totalRev) * 100 : 0
                return (
                  <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-500'}`}>
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
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })() : (() => {
          const itemMap = {}
          completedOrders.forEach((o) => {
            ;(o.items || []).forEach((item) => {
              if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 }
              itemMap[item.name].qty += item.quantity
              itemMap[item.name].revenue += (item.unit_price || 0) * item.quantity
            })
          })
          const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 10)
          return topItems.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Sin datos en este período</p>
          ) : (
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
          )
        })()}
      </div>
    </div>
  )
}
