import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sparkles, MessageCircle } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import OnboardingTips from '../components/OnboardingTips'
import { supabase } from '../config/supabase'
import useStore from '../store/useStore'
import { APP_CONFIG, buildWhatsAppLink } from '../config/app.config'

function SavingsBanner() {
  const { profile } = useStore()
  const [savings, setSavings] = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
      if (!data?.length) return
      const totalPaid = data.reduce((s, o) => s + Number(o.total), 0)
      setSavings(totalPaid * (APP_CONFIG.discount / (1 - APP_CONFIG.discount)))
    }
    load()
  }, [profile?.id])

  if (!savings || savings < 0.01) return null

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 flex items-center justify-center gap-2">
      <Sparkles size={13} className="text-white/80 flex-shrink-0" />
      <p className="text-white text-xs font-semibold">
        ¡Ahorraste <span className="font-black">{APP_CONFIG.currency} {savings.toFixed(2)}</span> con tus descuentos!
      </p>
      <Sparkles size={13} className="text-white/80 flex-shrink-0" />
    </div>
  )
}

export default function UserLayout() {
  const location = useLocation()
  const isRestaurantDetail = location.pathname.includes('/app/restaurante/')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <div className="flex-1 overflow-y-auto pb-28">
        <Outlet />
      </div>
      {!isRestaurantDetail && (
        <a href={buildWhatsAppLink('Hola MenuPago, necesito ayuda.')}
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-28 right-3 z-40 flex items-center gap-1.5 bg-green-500/80 backdrop-blur-sm text-white text-[11px] font-semibold pl-3 pr-3.5 py-2 rounded-full shadow-lg">
          <MessageCircle size={14} /> Contáctanos
        </a>
      )}
      <SavingsBanner />
      <BottomNav role="user" />
      <OnboardingTips />
    </div>
  )
}
