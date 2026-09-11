import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallButton() {
  const { deferredPrompt, isInstalled, isIOS, handleInstall } = useInstallPrompt()
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('ios') // 'ios' | 'android'

  if (isInstalled) return null

  const handleClick = () => {
    if (deferredPrompt) {
      handleInstall()
    } else if (isIOS) {
      setModalType('ios')
      setShowModal(true)
    } else {
      setModalType('android')
      setShowModal(true)
    }
  }

  return (
    <>
      <div className="bg-gradient-to-br from-primary-500 to-orange-400 rounded-3xl p-5">
        <button
          onClick={handleClick}
          className="w-full py-3 bg-white text-primary-500 text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
        >
          <Download size={16} />
          INSTALA MENUPAGO
        </button>
        <p className="text-white/80 text-[11px] text-center mt-2">en tu celular o en tu computadora</p>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-dark text-base">Instalar MenuPago</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {modalType === 'ios' ? (
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">1️⃣</span>
                  <p>Toca el ícono <span className="font-bold">Compartir</span> <span className="text-base">⬆️</span> en la barra de Safari</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">2️⃣</span>
                  <p>Desplázate y toca <span className="font-bold">"Agregar a pantalla de inicio"</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">3️⃣</span>
                  <p>Toca <span className="font-bold">"Agregar"</span> para confirmar</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-gray-600">
                <p className="text-gray-500 text-xs bg-gray-50 rounded-xl px-3 py-2">Abre este sitio en <span className="font-bold">Chrome</span> (Android) o <span className="font-bold">Safari</span> (iPhone) para instalarlo</p>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">📱</span>
                  <div>
                    <p className="font-bold">En Android (Chrome)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Menú ⋮ → "Añadir a pantalla de inicio"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">🍎</span>
                  <div>
                    <p className="font-bold">En iPhone (Safari)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Botón compartir ⬆️ → "Agregar a pantalla de inicio"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">💻</span>
                  <div>
                    <p className="font-bold">En PC / Mac (Chrome o Edge)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Ícono instalar 💾 en la barra de dirección</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full py-3 bg-primary-500 text-white text-sm font-bold rounded-xl"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
