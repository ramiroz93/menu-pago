import { useState, useEffect } from 'react'
import { ClipboardList, Bell, MessageCircle } from 'lucide-react'
import { supabase } from '../../config/supabase'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import Spinner from '../../components/Spinner'
import { APP_CONFIG } from '../../config/app.config'

export default function AdminAllOrders() {
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [notifying, setNotifying] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      const [{ data: ordersData }, { data: restsData }] = await Promise.all([
        supabase.from('orders')
          .select('id, order_number, total, status, created_at, items, notes, restaurant_id, restaurants(name), profiles(full_name)')
          .order('created_at', { ascending: false }).limit(100),
        supabase.from('restaurants').select('id, name, whatsapp'),
      ])
      setOrders(ordersData || [])
      const map = {}
      for (const r of (restsData || [])) map[r.id] = r
      setRestaurants(map)
      setLoading(false)
    }
    fetch()

    const channel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetch())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const reNotify = async (order) => {
    setNotifying(order.id)
    await supabase.functions.invoke('notify-restaurant', {
      body: { record: order },
    }).catch(() => {})
    setTimeout(() => setNotifying(null), 2000)
  }

  const getWhatsAppLink = (order) => {
    const rest = restaurants[order.restaurant_id]
    if (!rest?.whatsapp) return null
    const items = (order.items || []).map((i) => `  ${i.quantity}x ${i.name}`).join('\n')
    const msg = `Hola ${rest.name}, tienen un pedido #${order.order_number || ''} pendiente en MenuPago:\n\n${items}\n\nTotal: ${APP_CONFIG.currency} ${Number(order.total).toFixed(2)}\n\nPor favor acéptalo en la app.`
    return `https://wa.me/${rest.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const totals = orders.reduce((acc, o) => {
    if (o.status === 'completed') acc.revenue += Number(o.total)
    acc.count++
    return acc
  }, { revenue: 0, count: 0 })

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white px-4 pt-14 pb-0 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-dark">Todos los pedidos</h1>
          <div className="text-right">
            <p className="text-xs text-gray-400">Ingresos totales</p>
            <p className="font-bold text-primary-500 text-sm">{APP_CONFIG.currency} {totals.revenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          {[['all','Todos'], ['pending','Pendientes'], ['confirmed','Confirmados'], ['completed','Completados'], ['rejected','Rechazados']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${filter === k ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={40} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Sin pedidos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((o) => (
              <div key={o.id} className="bg-white rounded-xl shadow-sm p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {o.order_number && <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{o.order_number}</span>}
                      <p className="text-sm font-semibold text-dark">{o.profiles?.full_name}</p>
                    </div>
                    <p className="text-xs text-gray-400">{o.restaurants?.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <OrderStatusBadge status={o.status} />
                    <p className="font-bold text-dark text-sm mt-1">{APP_CONFIG.currency} {Number(o.total).toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                  {(o.items || []).map((i, idx) => <span key={idx}>{idx > 0 ? ', ' : ''}{i.quantity}x {i.name}</span>)}
                </div>
                {o.status === 'pending' && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                    <button onClick={() => reNotify(o)}
                      className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${notifying === o.id ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      <Bell size={12} /> {notifying === o.id ? '¡Enviado!' : 'Re-notificar'}
                    </button>
                    {(() => {
                      const waLink = getWhatsAppLink(o)
                      return waLink ? (
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 bg-green-100 text-green-600">
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
