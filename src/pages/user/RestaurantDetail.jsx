import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, ShoppingBag, MapPin, Star, ChevronDown, X } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import Spinner from '../../components/Spinner'
import { APP_CONFIG } from '../../config/app.config'
import { isRestaurantOpen } from '../../utils/scheduleUtils'

export default function RestaurantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, cart, cartRestaurantId, addToCart, removeFromCart, cartTotal, cartCount, clearCart, menuCache, setMenuCache } = useStore()
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
  const [ordering, setOrdering] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isPickup, setIsPickup] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [canRate, setCanRate] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: rest } = await supabase
        .from('restaurants').select('*').eq('id', id).single()

      if (!rest) {
        navigate('/app', { replace: true })
        return
      }

      setRestaurant(rest)

      const cached = menuCache[id]
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setMenuItems(cached.items)
      } else {
        const { data: menu } = await supabase
          .from('menu_items').select('*').eq('restaurant_id', id).eq('is_available', true).order('sort_order', { ascending: true, nullsFirst: false })
        setMenuItems(menu || [])
        setMenuCache(id, { restaurant: rest, items: menu || [] })
      }
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    const loadRating = async () => {
      const { data: completed } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', profile.id)
        .eq('restaurant_id', id)
        .eq('status', 'completed')
        .limit(1)
      if (!completed?.length) return
      setCanRate(true)
      const { data: existing } = await supabase
        .from('ratings')
        .select('rating')
        .eq('user_id', profile.id)
        .eq('restaurant_id', id)
        .maybeSingle()
      if (existing) setUserRating(existing.rating)
    }
    if (profile?.id) loadRating()
  }, [profile?.id, id])

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('user_locations').select('*').eq('user_id', profile.id).order('created_at')
      .then(({ data }) => setLocations(data || []))
  }, [profile?.id])

  // Redirigir si el restaurante está cerrado o sin saldo

  const DISC = APP_CONFIG.discount
  const discounted = (price) => Number(price) * (1 - DISC)
  const getQty = (itemId) => cart.find((c) => c.id === itemId)?.quantity || 0

  const handleOrder = async () => {
    if (cartCount() === 0) return
    if (restaurantClosed) {
      setError('Este restaurante no está disponible en este momento.')
      return
    }
    if (!isPickup && !selectedLocation) {
      setError('Debes seleccionar una ubicación de entrega. Puedes agregar una en tu Perfil.')
      return
    }
    const total = cartTotal() * (1 - DISC)
    if (profile.wallet_balance < total) {
      setError(`Saldo insuficiente. Tienes ${APP_CONFIG.currency} ${Number(profile.wallet_balance).toFixed(2)}`)
      return
    }
    setOrdering(true)
    setError('')

    const items = cart.map((c) => ({
      id: c.id,
      quantity: c.quantity,
    }))

    const { data: result, error: orderErr } = await supabase.rpc('place_order', {
      p_restaurant_id: id,
      p_items: items,
      p_notes: notes.trim() || null,
      p_delivery_location: isPickup
        ? { pickup: true }
        : (selectedLocation ? { name: selectedLocation.name, maps_url: selectedLocation.maps_url } : null),
    })

    if (orderErr) { setError('Error al enviar el pedido. Intenta de nuevo.'); setOrdering(false); return }
    if (result?.error) { setError(result.error); setOrdering(false); return }

    // Refrescar saldo del perfil
    const { data: updated } = await supabase.from('profiles').select('wallet_balance').eq('id', profile.id).single()
    if (updated) useStore.getState().setProfile({ ...profile, wallet_balance: updated.wallet_balance })

    clearCart()
    setSuccess(true)
    setOrdering(false)
    setTimeout(() => navigate('/app/pedidos'), 2000)
  }

  const handleRate = async (stars) => {
    setUserRating(stars)
    await supabase.rpc('rate_restaurant', { p_restaurant_id: id, p_rating: stars })
    const { data } = await supabase.from('restaurants').select('rating, rating_count').eq('id', id).single()
    if (data) setRestaurant((prev) => ({ ...prev, ...data }))
  }

  const restaurantClosed = restaurant && (
    !isRestaurantOpen(restaurant) ||
    !restaurant.is_active ||
    Number(restaurant.consumption_balance ?? 0) < APP_CONFIG.minConsumptionBalance
  )

  const LABELS = ['', 'Pésimo 😞', 'Malo 😕', 'Regular 😐', 'Bueno 😊', '¡Excelente! 🤩']

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!restaurant) return <div className="text-center py-24 text-gray-400">Restaurante no encontrado</div>

  const cartDifferentRestaurant = cartRestaurantId && cartRestaurantId !== id && cartCount() > 0

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <div className="relative h-52 bg-gray-200">
        {restaurant.cover_image
          ? <img src={restaurant.cover_image} alt={restaurant.name} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-300"><span className="text-6xl">🍽️</span></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow">
          <ArrowLeft size={18} />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white text-xl font-bold">{restaurant.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-white/80 text-xs flex-wrap">
            {(restaurant.categories || []).map((cat) => (
              <span key={cat} className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">{cat}</span>
            ))}
            {restaurant.rating && (
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                {restaurant.rating}
                {restaurant.rating_count > 0 && <span className="text-white/70">({restaurant.rating_count})</span>}
              </span>
            )}
            {restaurant.address && <span className="flex items-center gap-1"><MapPin size={11} />{restaurant.address}</span>}
          </div>
        </div>
      </div>

      {/* Menú */}
      <div className="flex-1 px-4 py-4 pb-36">
        {restaurant.description && (
          <p className="text-gray-500 text-sm mb-4">{restaurant.description}</p>
        )}

        {restaurantClosed && (
          <div className="bg-gray-900/90 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-2xl">😴</span>
            <div>
              <p className="text-white text-sm font-bold">Restaurante cerrado</p>
              <p className="text-gray-400 text-xs">Puedes ver el menú, pero no se aceptan pedidos en este momento.</p>
            </div>
          </div>
        )}

        {cartDifferentRestaurant && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs text-yellow-700">
            Tienes un pedido en otro restaurante. Al agregar aquí se limpiará ese carrito.
          </div>
        )}

        {menuItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Sin platos disponibles por ahora</div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-bold text-dark text-base">Menú</h2>
            {menuItems.map((item) => {
              const qty = getQty(item.id)
              return (
                <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm flex gap-3">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="flex-shrink-0 focus:outline-none"
                  >
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                      : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">🍴</div>
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <button onClick={() => setSelectedItem(item)} className="text-left focus:outline-none">
                        <p className="font-semibold text-sm text-dark">{item.name}</p>
                      </button>
                      <span className="flex-shrink-0 text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">-15%</span>
                    </div>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <p className="text-primary-500 font-bold text-sm">{APP_CONFIG.currency} {discounted(item.price).toFixed(2)}</p>
                      <p className="text-gray-300 text-xs line-through">{APP_CONFIG.currency} {Number(item.price).toFixed(2)}</p>
                    </div>
                  </div>
                  {!restaurantClosed && (
                    <div className="flex flex-col items-center justify-center gap-1">
                      {qty > 0 ? (
                        <>
                          <button onClick={() => addToCart(item, id)} className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center"><Plus size={14} /></button>
                          <span className="font-bold text-sm text-dark">{qty}</span>
                          <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"><Minus size={14} /></button>
                        </>
                      ) : (
                        <button onClick={() => addToCart(item, id)} className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center"><Plus size={14} /></button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Calificación */}
      {canRate && (
        <div className="mx-4 mb-4 bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-dark mb-3">
            {userRating ? 'Tu calificación' : 'Califica este restaurante'}
          </p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform active:scale-125 hover:scale-110">
                <Star size={36}
                  className={`transition-colors ${star <= (hovered || userRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
              </button>
            ))}
          </div>
          {(hovered || userRating) > 0 && (
            <p className="text-center text-sm text-gray-500 mt-2">{LABELS[hovered || userRating]}</p>
          )}
        </div>
      )}

      {/* Modal detalle del plato */}
      {selectedItem && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-white rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Imagen */}
            <div className="relative flex-shrink-0">
              {selectedItem.image
                ? <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-56 object-cover" />
                : <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-6xl">🍴</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white rounded-full p-2"
              >
                <X size={18} />
              </button>
              <span className="absolute top-4 left-4 text-[11px] font-bold bg-green-500 text-white px-2 py-1 rounded-full">-15% descuento</span>
            </div>

            {/* Contenido scrolleable */}
            <div className="overflow-y-auto p-5 space-y-3">
              <h2 className="text-xl font-bold text-dark">{selectedItem.name}</h2>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary-500">{APP_CONFIG.currency} {discounted(selectedItem.price).toFixed(2)}</span>
                <span className="text-sm text-gray-300 line-through">{APP_CONFIG.currency} {Number(selectedItem.price).toFixed(2)}</span>
              </div>

              {selectedItem.description ? (
                <p className="text-sm text-gray-600 leading-relaxed">{selectedItem.description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Sin descripción disponible</p>
              )}

              {/* Botón agregar (solo si está abierto) */}
              {!restaurantClosed && (
                <div className="pt-2">
                  {getQty(selectedItem.id) > 0 ? (
                    <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3">
                      <button
                        onClick={() => removeFromCart(selectedItem.id)}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm"
                      >
                        <Minus size={16} className="text-gray-600" />
                      </button>
                      <span className="font-bold text-lg text-dark">{getQty(selectedItem.id)}</span>
                      <button
                        onClick={() => addToCart(selectedItem, id)}
                        className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center shadow-sm"
                      >
                        <Plus size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { addToCart(selectedItem, id); setSelectedItem(null) }}
                      className="w-full bg-primary-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Agregar al pedido
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Carrito fijo */}
      {cartCount() > 0 && cartRestaurantId === id && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 space-y-2">
          {error && <p className="text-red-500 text-xs text-center bg-red-50 py-1.5 rounded-lg px-3">{error}</p>}
          {success && <p className="text-green-600 text-xs text-center bg-green-50 py-1.5 rounded-lg px-3">¡Pedido enviado! Redirigiendo...</p>}
          {/* Selector Delivery / Recoger en local */}
          {restaurant.accepts_pickup && (
            <div className="flex gap-1.5 bg-white/95 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-gray-200">
              <button onClick={() => { setIsPickup(false); setError('') }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors
                  ${!isPickup ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400'}`}>
                🛵 Delivery
              </button>
              <button onClick={() => { setIsPickup(true); setError('') }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors
                  ${isPickup ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400'}`}>
                🏃 Recoger en local
              </button>
            </div>
          )}

          {/* Selector de ubicación (solo delivery) */}
          {!isPickup && (
            locations.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                <MapPin size={15} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-yellow-700">Necesitas una ubicación guardada</p>
                  <p className="text-[11px] text-yellow-600 mt-0.5">Ve a tu <strong>Perfil → Mis ubicaciones</strong> y agrega una dirección antes de pedir.</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={selectedLocation?.id || ''}
                  onChange={(e) => {
                    setSelectedLocation(locations.find((l) => l.id === e.target.value) || null)
                    setError('')
                  }}
                  className={`w-full bg-white/95 backdrop-blur-sm rounded-2xl pl-9 pr-8 py-2.5 text-sm shadow-lg focus:outline-none focus:ring-2 appearance-none border
                    ${!selectedLocation ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-primary-400'}`}>
                  <option value="">📍 Seleccionar ubicación de entrega *</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )
          )}

          {/* Dirección del restaurante (solo pickup) */}
          {isPickup && (
            restaurant.maps ? (
              <a href={restaurant.maps} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 shadow-lg">
                <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-700">Pasa a recoger en</p>
                  <p className="text-xs text-blue-500 truncate">{restaurant.address || 'Ver ubicación'}</p>
                </div>
                <span className="text-[11px] text-blue-600 font-semibold whitespace-nowrap">Google Maps →</span>
              </a>
            ) : restaurant.address ? (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 shadow-lg">
                <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs font-bold text-blue-700">{restaurant.address}</p>
              </div>
            ) : null
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas para el restaurante: sin cebolla, extra salsa..."
            rows={2}
            maxLength={200}
            className="w-full bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl px-4 py-2.5 text-sm shadow-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 placeholder:text-gray-400"
          />
          <button onClick={handleOrder} disabled={ordering || (!isPickup && locations.length === 0)}
            className="w-full bg-primary-500 text-white font-bold py-3.5 rounded-2xl shadow-lg flex items-center justify-between px-5 hover:bg-primary-600 transition-colors disabled:opacity-60">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>{cartCount()} {cartCount() === 1 ? 'producto' : 'productos'}</span>
            </div>
            <div className="text-right">
              {!ordering && <p className="text-[10px] text-primary-200 line-through">{APP_CONFIG.currency} {cartTotal().toFixed(2)}</p>}
              <p>{ordering ? 'Enviando...' : `Pedir · ${APP_CONFIG.currency} ${(cartTotal() * (1 - DISC)).toFixed(2)}`}</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
