import { useState, useEffect } from 'react'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const ua = navigator.userAgent
    setIsIOS(/iPhone|iPad|iPod/.test(ua) && !window.MSStream)

    // Pick up event captured before React mounted
    if (window.__deferredInstallPrompt) {
      setDeferredPrompt(window.__deferredInstallPrompt)
    }

    const handler = (e) => {
      e.preventDefault()
      window.__deferredInstallPrompt = e
      setDeferredPrompt(e)
    }
    const onInstalled = () => setIsInstalled(true)

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    window.__deferredInstallPrompt = null
    if (outcome === 'accepted') setIsInstalled(true)
    return outcome === 'accepted'
  }

  return { deferredPrompt, isInstalled, isIOS, handleInstall }
}
