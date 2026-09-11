import { useNavigate } from 'react-router-dom'
import { MapPin, Star, Heart, BadgeCheck, Clock } from 'lucide-react'
import { APP_CONFIG } from '../config/app.config'
import { getNextOpenInfo, isRestaurantOpen } from '../utils/scheduleUtils'

export default function RestaurantCard({ restaurant, isFavorite, onToggleFavorite }) {
  const navigate = useNavigate()
  const { id, name, categories, address, cover_image, logo, rating, rating_count, is_open, is_active, consumption_balance, same_price } = restaurant
  const lowBalance = Number(consumption_balance ?? 0) < APP_CONFIG.minConsumptionBalance
  const effectivelyOpen = isRestaurantOpen(restaurant) && !lowBalance && is_active !== false
  const blocked = !effectivelyOpen
  const nextOpen = blocked ? getNextOpenInfo(restaurant) : null
  const thumbSrc = logo || cover_image

  const handleClick = () => {
    navigate(`/app/restaurante/${id}`)
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm transition-shadow cursor-pointer active:scale-[0.99]
        ${blocked ? 'opacity-60' : 'hover:shadow-md'}`}
    >
      {/* Logo */}
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
          {thumbSrc ? (
            <img src={thumbSrc} alt={name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(e) }}
            className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow transition-all active:scale-110
              ${isFavorite ? 'bg-red-500' : 'bg-white border border-gray-200'}`}>
            <Heart size={11} className={isFavorite ? 'fill-white text-white' : 'text-gray-400'} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-dark text-sm leading-tight truncate flex-1">{name}</h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">-15%</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${effectivelyOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {effectivelyOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          {(categories || []).slice(0, 2).map((cat) => (
            <span key={cat} className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">{cat}</span>
          ))}
          {rating && (
            <span className="flex items-center gap-0.5">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span>{rating}</span>
              {rating_count > 0 && <span className="text-gray-400">({rating_count})</span>}
            </span>
          )}
        </div>
        {nextOpen && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${nextOpen.soon ? 'text-amber-500' : 'text-gray-400'}`}>
            <Clock size={10} className="flex-shrink-0" />
            <span className={nextOpen.soon ? 'font-semibold' : ''}>{nextOpen.text}</span>
          </div>
        )}
        {same_price && (
          <div className="inline-flex items-center gap-1 mt-1.5 bg-orange-50 rounded-lg px-2 py-1">
            <BadgeCheck size={11} className="text-orange-500 flex-shrink-0" />
            <span className="text-[10px] font-semibold text-orange-600">Precio Real del local + el 15% de Descuento</span>
          </div>
        )}
        {address && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <MapPin size={11} />
            <span className="truncate">{address}</span>
          </div>
        )}
      </div>
    </div>
  )
}
