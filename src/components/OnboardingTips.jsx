import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'menupago_onboarding_v1'

// 4 tabs en justify-around → centros en 12.5%, 37.5%, 62.5%, 87.5% del ancho del nav
const TIPS = [
  {
    tabIndex: 3, // Perfil (4º tab → 87.5%)
    icon: '📍',
    title: 'Agrega tu ubicación',
    message: 'No te olvides agregar tu ubicación en tu perfil para recibir tus pedidos',
    cta: 'Entendido',
  },
  {
    tabIndex: 1, // Saldo (2º tab → 37.5%)
    icon: '💰',
    title: 'Recarga tu saldo',
    message: 'No te olvides recargar saldo para hacer tus pedidos con el 20% TOTAL de descuentos',
    cta: '¡Vamos!',
  },
]

export default function OnboardingTips() {
  const [step, setStep] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setStep(0)
  }, [])

  const advance = () => {
    if (step < TIPS.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem(STORAGE_KEY, '1')
      setStep(-1)
    }
  }

  if (step === null || step < 0) return null

  const tip = TIPS[step]

  // Centro del tab como % del ancho de pantalla
  const tabCenterPct = ((tip.tabIndex * 2 + 1) / 8) * 100 // 12.5 | 37.5 | 62.5 | 87.5

  // El card mide ~240px. Lo centramos sobre el tab pero lo clampeamos a los bordes.
  // La flecha (8px) queda centrada dentro del card apuntando al tab.
  const CARD_W = 240
  const MARGIN = 12

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className="fixed inset-0 z-[90] bg-black/50"
        onClick={advance}
      />

      {/* Anillo pulsante sobre el tab objetivo */}
      <div
        className="fixed z-[92] pointer-events-none"
        style={{
          bottom: '8px',
          left: `calc(${tabCenterPct}% - 26px)`,
          width: 52,
          height: 52,
          borderRadius: 14,
          boxShadow: '0 0 0 3px white, 0 0 0 6px rgba(255,255,255,0.4)',
          animation: 'onboarding-pulse 1.4s ease-in-out infinite',
        }}
      />

      {/* Tooltip card posicionado sobre la flecha que apunta al tab */}
      <OnboardingCard
        tip={tip}
        tabCenterPct={tabCenterPct}
        cardW={CARD_W}
        margin={MARGIN}
        step={step}
        total={TIPS.length}
        onAdvance={advance}
      />

      <style>{`
        @keyframes onboarding-pulse {
          0%, 100% { box-shadow: 0 0 0 3px white, 0 0 0 6px rgba(255,255,255,0.4); }
          50%       { box-shadow: 0 0 0 3px white, 0 0 0 10px rgba(255,255,255,0.15); }
        }
      `}</style>
    </>
  )
}

function OnboardingCard({ tip, tabCenterPct, cardW, margin, step, total, onAdvance }) {
  // Calcular left del card para que la flecha quede sobre el tab
  // La flecha queda centrada al card cuando este está correctamente alineado
  // Clampear para no salir de pantalla
  const leftVw = tabCenterPct // % del viewport
  // En JS usamos style dinámico para calcular clamp real
  // La flecha (8px) se posiciona con left relativo dentro del card

  return (
    <div
      className="fixed z-[93]"
      style={{
        bottom: 88,
        // Centramos el card sobre el tab, pero lo clampeamos al borde
        left: `clamp(${margin}px, calc(${leftVw}vw - ${cardW / 2}px), calc(100vw - ${cardW + margin}px))`,
        width: cardW,
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-visible relative">
        {/* Contenido */}
        <div className="p-4">
          <div className="flex items-start gap-2.5 pr-6">
            <span className="text-2xl leading-none mt-0.5">{tip.icon}</span>
            <div>
              <p className="font-bold text-dark text-sm mb-1">{tip.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{tip.message}</p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onAdvance}
            className="mt-3 w-full bg-primary-500 text-white text-sm font-bold py-2.5 rounded-xl"
          >
            {tip.cta}
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-2.5">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'bg-primary-500 w-4' : 'bg-gray-200 w-1.5'}`}
              />
            ))}
          </div>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onAdvance}
          className="absolute top-2.5 right-2.5 text-gray-300 hover:text-gray-500 p-1"
        >
          <X size={14} />
        </button>

        {/* Flecha apuntando hacia abajo (al tab) */}
        <ArrowDown tabCenterPct={tabCenterPct} cardW={cardW} margin={margin} />
      </div>
    </div>
  )
}

function ArrowDown({ tabCenterPct, cardW, margin }) {
  // Calculamos dónde cae el centro del tab dentro del card
  // cardLeft = clamp(margin, tabCenter_px - cardW/2, vw - cardW - margin)
  // arrowLeft_within_card = tabCenter_px - cardLeft
  // En CSS puro no podemos calcular vw dinámicamente, usamos un valor aproximado (375px base)
  const approxVw = 375
  const tabCenter = (tabCenterPct / 100) * approxVw
  const cardLeft = Math.min(Math.max(margin, tabCenter - cardW / 2), approxVw - cardW - margin)
  const arrowX = tabCenter - cardLeft

  const clamped = Math.min(Math.max(arrowX, 16), cardW - 16)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: -7,
        left: clamped - 7,
        width: 14,
        height: 14,
        background: 'white',
        transform: 'rotate(45deg)',
        boxShadow: '2px 2px 4px rgba(0,0,0,0.08)',
      }}
    />
  )
}
