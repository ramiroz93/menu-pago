import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import Spinner from '../../components/Spinner'
import { APP_CONFIG } from '../../config/app.config'

export default function Wallet() {
  const { profile } = useStore()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('top_up_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setTransactions(data || [])
      setLoading(false)
    }
    fetch()
  }, [profile.id])

  const statusLabel = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' }
  const statusColor = { pending: 'text-yellow-600 bg-yellow-50', approved: 'text-green-600 bg-green-50', rejected: 'text-red-600 bg-red-50' }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-4 pt-14 pb-8">
        <p className="text-primary-100 text-sm">Tu saldo disponible</p>
        <h1 className="text-white text-4xl font-black mt-1">
          {APP_CONFIG.currency} {Number(profile?.wallet_balance || 0).toFixed(2)}
        </h1>
        <p className="text-primary-200 text-xs mt-1">Bonus 5% en cada recarga</p>

        <Link to="/app/wallet/recargar"
          className="mt-5 inline-flex items-center gap-2 bg-white text-primary-600 font-bold text-sm px-5 py-2.5 rounded-xl shadow hover:bg-primary-50 transition-colors">
          <Plus size={16} /> Recargar saldo
        </Link>
      </div>

      {/* Historial de recargas */}
      <div className="flex-1 px-4 py-5">
        <h2 className="font-bold text-dark text-base mb-3">Historial de recargas</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10">
            <WalletIcon size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aún no has hecho recargas</p>
            <Link to="/app/wallet/recargar" className="text-primary-500 text-sm font-semibold mt-1 inline-block">Hacer mi primera recarga</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${t.status === 'approved' ? 'bg-green-100' : t.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  {t.status === 'approved' ? <ArrowDownLeft size={16} className="text-green-600" /> : <Clock size={16} className={t.status === 'rejected' ? 'text-red-500' : 'text-yellow-600'} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark">Recarga de {APP_CONFIG.currency} {Number(t.amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date(t.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {t.status === 'rejected' && t.rejection_reason && (
                    <p className="text-[11px] text-red-400 mt-0.5">Motivo: {t.rejection_reason}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {t.status === 'approved' && (
                    <p className="text-green-600 font-bold text-sm">+{APP_CONFIG.currency} {Number(t.total_credited).toFixed(2)}</p>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[t.status]}`}>
                    {statusLabel[t.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
