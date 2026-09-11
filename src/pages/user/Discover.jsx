import { useState, useEffect, useRef } from 'react'
import { Search, LogOut, ChevronRight, Utensils, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import RestaurantCard from '../../components/RestaurantCard'
import Spinner from '../../components/Spinner'
import { APP_CONFIG } from '../../config/app.config'
import { isRestaurantOpen } from '../../utils/scheduleUtils'

const DISC = APP_CONFIG.discount

const SYNONYMS = [
  ['hamburguesa', 'hamburguesas', 'burger', 'burguer', 'burgers', 'hamburgesa'],
  ['pollo', 'chicken', 'pollito'],
  ['pizza', 'pizzas', 'pizzeta'],
  ['ensalada', 'ensaladas', 'salad'],
  ['papas', 'papas fritas', 'fries', 'french fries', 'patatas'],
  ['sandwich', 'sandwiches', 'sándwich', 'sanguche', 'sanguches'],
  ['jugo', 'jugos', 'juice', 'zumo'],
  ['refresco', 'refrescos', 'gaseosa', 'gaseosas', 'soda'],
  ['helado', 'helados', 'ice cream'],
  ['postre', 'postres', 'dessert'],
  ['carne', 'carnes', 'res', 'beef', 'churrasco', 'bife', 'lomo'],
  ['cerdo', 'pork', 'chancho', 'chicharron', 'chicharrón'],
  ['taco', 'tacos', 'burrito', 'burritos', 'mexicano', 'mexicana'],
  ['sushi', 'roll', 'rolls', 'japonés', 'japonesa'],
  ['alitas', 'wings', 'alita'],
  ['wrap', 'wraps'],
  ['pasta', 'pastas', 'fideo', 'fideos', 'espagueti', 'spaghetti'],
  ['café', 'cafe', 'coffee', 'capuchino', 'cappuccino', 'latte'],
  ['desayuno', 'desayunos', 'breakfast'],
  ['almuerzo', 'almuerzos', 'lunch', 'menú', 'menu del dia'],
  ['salteña', 'salteñas', 'saltena', 'saltenas'],
  ['empanada', 'empanadas'],
  ['hot dog', 'hotdog', 'perro caliente', 'completo'],
]

function getSearchTerms(input) {
  const lower = input.toLowerCase()
  const terms = new Set([lower])
  for (const group of SYNONYMS) {
    if (group.some((s) => lower.includes(s) || s.includes(lower))) {
      group.forEach((s) => terms.add(s))
    }
  }
  return [...terms]
}

function DishCard({ dish, navigate }) {
  const rest = dish.restaurants
  const isAvailable = rest?.is_active && rest?.is_open && Number(rest?.consumption_balance ?? 0) >= APP_CONFIG.minConsumptionBalance
  const discounted = Number(dish.price) * (1 - DISC)

  return (
    <div
      onClick={() => isAvailable && navigate(`/app/restaurante/${dish.restaurant_id}`)}
      className={`flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm transition-shadow
        ${isAvailable ? 'hover:shadow-md cursor-pointer active:scale-[0.99]' : 'opacity-60 cursor-not-allowed'}`}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {dish.image
          ? <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-dark text-sm truncate">{dish.name}</p>
          <span className="text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">-15%</span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <p className="text-primary-500 font-bold text-sm">{APP_CONFIG.currency} {discounted.toFixed(2)}</p>
          <p className="text-gray-300 text-xs line-through">{APP_CONFIG.currency} {Number(dish.price).toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {rest?.logo
              ? <img src={rest.logo} alt={rest.name} className="w-full h-full object-cover" loading="lazy" />
              : <Utensils size={10} className="text-gray-400 m-auto" />
            }
          </div>
          <p className="text-xs text-gray-400 truncate">{rest?.name}</p>
          {!isAvailable && <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full ml-1">Cerrado</span>}
        </div>
      </div>
      {isAvailable && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
    </div>
  )
}

export default function Discover() {
  const { profile, logout } = useStore()
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [dishResults, setDishResults] = useState([])
  const [similarDishes, setSimilarDishes] = useState([])
  const [searchingDishes, setSearchingDishes] = useState(false)
  const searchTimer = useRef(null)

  useEffect(() => {
    fetchRestaurants()
    fetchCategories()
    const interval = setInterval(fetchRestaurants, 60000)

    const channel = supabase.channel('user-restaurants')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'restaurants' },
        () => fetchRestaurants()
      ).subscribe()

    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const loadFavorites = async () => {
      const { data } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_id', profile.id)
      setFavoriteIds(new Set((data || []).map((f) => f.restaurant_id)))
    }
    if (profile?.id) loadFavorites()
  }, [profile?.id])

  const fetchRestaurants = async () => {
    const userCity = profile?.city
    const [{ data: rests }, { data: sales }] = await Promise.all([
      userCity
        ? supabase.from('restaurants').select('*').eq('city', userCity).eq('is_active', true)
        : supabase.from('restaurants').select('*').eq('is_active', true),
      supabase.from('orders').select('restaurant_id, total').eq('status', 'completed'),
    ])

    const salesMap = {}
    for (const o of (sales || [])) {
      salesMap[o.restaurant_id] = (salesMap[o.restaurant_id] || 0) + Number(o.total)
    }

    const withOpen = (rests || []).map((r) => {
      const lowBalance = Number(r.consumption_balance ?? 0) < APP_CONFIG.minConsumptionBalance
      return { ...r, is_open: !lowBalance && isRestaurantOpen(r) }
    })

    // Separar en grupos
    const openTop = withOpen.filter((r) => r.is_open && r.sort_order)
    const openRest = withOpen.filter((r) => r.is_open && !r.sort_order)
    const closedTop = withOpen.filter((r) => !r.is_open && r.sort_order)
    const closedRest = withOpen.filter((r) => !r.is_open && !r.sort_order)

    // 1. Abiertos con posición (1-5) ordenados por posición
    openTop.sort((a, b) => a.sort_order - b.sort_order)
    // 2. Abiertos sin posición ordenados por ventas desc
    openRest.sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0))
    // 3. Cerrados con posición primero (por posición), luego cerrados sin posición (por ventas desc)
    closedTop.sort((a, b) => a.sort_order - b.sort_order)
    closedRest.sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0))

    setRestaurants([...openTop, ...openRest, ...closedTop, ...closedRest])
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('name').order('name')
    setCategories(data?.map((c) => c.name) || [])
  }

  useEffect(() => {
    clearTimeout(searchTimer.current)
    if (!search.trim()) {
      setDishResults([])
      setSimilarDishes([])
      return
    }
    setSearchingDishes(true)
    searchTimer.current = setTimeout(async () => {
      const userCity = profile?.city
      const term = search.trim()
      const terms = getSearchTerms(term)
      const sel = 'id, name, price, image, category, restaurant_id, restaurants(id, name, logo, cover_image, is_open, is_active, consumption_balance, city, categories)'
      const cityFilter = (list) => userCity
        ? (list || []).filter((d) => !d.restaurants?.city || d.restaurants.city === userCity)
        : (list || [])
      const orFilter = (field) => terms.map((t) => `${field}.ilike.%${t}%`).join(',')

      // 1. Buscar por nombre del plato (con sinónimos)
      const { data: byName } = await supabase
        .from('menu_items').select(sel)
        .or(orFilter('name'))
        .eq('is_available', true).limit(15)
      let results = cityFilter(byName)

      // 2. Si no hay resultados, buscar por descripción del plato
      if (results.length === 0) {
        const { data: byDesc } = await supabase
          .from('menu_items').select(sel)
          .or(orFilter('description'))
          .eq('is_available', true).limit(15)
        results = cityFilter(byDesc)
      }

      // 3. Si aún no hay, buscar por categoría del plato
      if (results.length === 0) {
        const { data: byCat } = await supabase
          .from('menu_items').select(sel)
          .or(orFilter('category'))
          .eq('is_available', true).limit(15)
        results = cityFilter(byCat)
      }

      // 4. Si aún no hay, buscar restaurantes cuyas categorías contengan los términos
      if (results.length === 0) {
        const matchedRests = restaurants.filter((r) =>
          terms.some((t) =>
            (r.categories || []).some((c) => c.toLowerCase().includes(t))
            || r.name.toLowerCase().includes(t)
          )
        )
        if (matchedRests.length > 0) {
          const restIds = matchedRests.map((r) => r.id)
          const { data: byRest } = await supabase
            .from('menu_items').select(sel)
            .in('restaurant_id', restIds)
            .eq('is_available', true).limit(20)
          results = cityFilter(byRest)
        }
      }

      setDishResults(results)

      // Similares: platos de las mismas categorías encontradas
      const foundIds = new Set(results.map((d) => d.id))
      const cats = [...new Set(results.map((d) => d.category).filter(Boolean))]
      if (cats.length > 0) {
        const { data: sim } = await supabase
          .from('menu_items').select(sel)
          .in('category', cats)
          .eq('is_available', true).limit(10)
        setSimilarDishes(cityFilter(sim).filter((d) => !foundIds.has(d.id)))
      } else if (results.length === 0) {
        // 5. Último recurso: mostrar platos populares (los primeros disponibles)
        const { data: popular } = await supabase
          .from('menu_items').select(sel)
          .eq('is_available', true).limit(10)
        setSimilarDishes(cityFilter(popular))
      } else {
        setSimilarDishes([])
      }
      setSearchingDishes(false)
    }, 400)
  }, [search])

  const toggleFavorite = async (restaurantId, e) => {
    e.preventDefault()
    e.stopPropagation()
    const isFav = favoriteIds.has(restaurantId)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      isFav ? next.delete(restaurantId) : next.add(restaurantId)
      return next
    })
    if (isFav) {
      await supabase.from('favorites').delete()
        .eq('user_id', profile.id).eq('restaurant_id', restaurantId)
    } else {
      await supabase.from('favorites').insert({ user_id: profile.id, restaurant_id: restaurantId })
    }
  }

  const allTabs = ['Todos', '❤️ Favoritos', ...categories]

  const filtered = restaurants.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Todos'
      ? true
      : category === '❤️ Favoritos'
      ? favoriteIds.has(r.id)
      : (r.categories || []).includes(category)
    return matchSearch && matchCat
  })

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400">Hola,</p>
            <h1 className="text-lg font-bold text-dark leading-tight">{profile?.full_name?.split(' ')[0]} 👋</h1>
            {profile?.city && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-primary-400" />
                <span className="text-[11px] text-primary-500 font-medium">{profile.city}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary-50 border border-primary-100 rounded-xl px-3 py-1.5 text-center">
              <p className="text-[10px] text-primary-600 font-medium">Saldo</p>
              <p className="text-primary-700 font-bold text-sm">{APP_CONFIG.currency} {Number(profile?.wallet_balance || 0).toFixed(2)}</p>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        {/* Buscador */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="¿Qué te antojas hoy?"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-white border-b border-gray-100">
        {allTabs.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${category === cat ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : search.trim() ? (
          /* Resultados de búsqueda de platos */
          searchingDishes ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : dishResults.length === 0 && similarDishes.length === 0 && filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl">🔍</span>
              <p className="text-gray-500 text-sm mt-2">Sin resultados para "{search}"</p>
              <p className="text-gray-400 text-xs mt-1">Intenta con otro nombre de plato o restaurante</p>
            </div>
          ) : (
            <div className="space-y-5">
              {dishResults.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    {dishResults.length > 0 ? `Platos encontrados (${dishResults.length})` : 'Resultados'}
                  </p>
                  <div className="space-y-2">
                    {dishResults.map((d) => <DishCard key={d.id} dish={d} navigate={navigate} />)}
                  </div>
                </div>
              )}

              {similarDishes.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    {dishResults.length === 0 ? 'Te podría interesar' : 'También te puede gustar'}
                  </p>
                  <div className="space-y-2">
                    {similarDishes.map((d) => <DishCard key={d.id} dish={d} navigate={navigate} />)}
                  </div>
                </div>
              )}

              {filtered.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Restaurantes
                  </p>
                  <div className="space-y-2">
                    {filtered.map((r) => (
                      <RestaurantCard key={r.id} restaurant={r}
                        isFavorite={favoriteIds.has(r.id)}
                        onToggleFavorite={(e) => toggleFavorite(r.id, e)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : category === '❤️ Favoritos' && filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl">❤️</span>
            <p className="text-gray-500 text-sm mt-2">Aún no tienes favoritos</p>
            <p className="text-gray-400 text-xs mt-1">Toca el corazón en cualquier restaurante</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl">🍽️</span>
            <p className="text-gray-500 text-sm mt-2">No hay restaurantes disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r}
                isFavorite={favoriteIds.has(r.id)}
                onToggleFavorite={(e) => toggleFavorite(r.id, e)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
