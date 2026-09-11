import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

export default function CountdownTimer({ confirmedAt, estimatedMinutes, compact = false }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!confirmedAt || !estimatedMinutes) return
    const endTime = new Date(confirmedAt).getTime() + estimatedMinutes * 60 * 1000

    const tick = () => setRemaining(endTime - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [confirmedAt, estimatedMinutes])

  if (remaining === null) return null

  const totalMs = estimatedMinutes * 60 * 1000
  const pct = Math.max(0, remaining / totalMs)
  const expired = remaining <= 0

  const mins = expired ? 0 : Math.floor(remaining / 60000)
  const secs = expired ? 0 : Math.floor((remaining % 60000) / 1000)

  const barColor = pct > 0.5 ? 'bg-green-500' : pct > 0.25 ? 'bg-amber-400' : 'bg-red-500'
  const textColor = expired ? 'text-red-500' : pct > 0.5 ? 'text-green-600' : pct > 0.25 ? 'text-amber-500' : 'text-red-500'

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs font-bold ${textColor}`}>
        <Timer size={12} />
        {expired
          ? <span>Tiempo superado</span>
          : <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} restantes</span>
        }
      </div>
    )
  }

  return (
    <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-sm font-bold ${textColor}`}>
          <Timer size={14} />
          {expired
            ? <span>Tiempo estimado superado</span>
            : <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
          }
        </div>
        {!expired && (
          <span className="text-[10px] text-gray-400 font-medium">de {estimatedMinutes} min estimados</span>
        )}
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  )
}
