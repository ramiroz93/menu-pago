import { supabase } from '../config/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function subscribeToPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  if (!VAPID_PUBLIC_KEY) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
    // Replace existing subscription for this device/user
    await supabase.from('push_subscriptions').delete().eq('user_id', userId)
    await supabase.from('push_subscriptions').insert({
      user_id: userId,
      subscription: sub.toJSON(),
    })
  } catch (err) {
    console.warn('Push subscription error:', err)
  }
}

export async function unsubscribeFromPush(userId) {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    if (userId) await supabase.from('push_subscriptions').delete().eq('user_id', userId)
  } catch (err) {
    console.warn('Push unsubscribe error:', err)
  }
}
