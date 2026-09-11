import webpush from 'npm:web-push'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

webpush.setVapidDetails(
  'mailto:virtuallcorpconsultora@gmail.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

const STATUS_MSG: Record<string, { title: string; body: string }> = {
  confirmed:        { title: '✅ Pedido confirmado',   body: 'El restaurante aceptó tu pedido.' },
  preparing:        { title: '👨‍🍳 Preparando tu pedido', body: 'Ya están cocinando. ¡Pronto listo!' },
  waiting_delivery: { title: '🎉 Pedido listo',         body: 'Tu pedido está listo para entrega.' },
  on_the_way:       { title: '🛵 En camino',            body: '¡Tu pedido está en camino!' },
  delivered:        { title: '✅ Pedido entregado',     body: '¡Buen provecho! Gracias por usar Menu-Pago.' },
  rejected:         { title: '❌ Pedido rechazado',     body: 'Tu saldo fue reembolsado automáticamente.' },
}

async function sendPush(userId: string, title: string, body: string, url: string) {
  console.log('sendPush called for user:', userId, 'title:', title)

  const { data: subRow, error: subErr } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .maybeSingle()

  if (subErr) { console.error('DB error:', subErr); return }
  if (!subRow?.subscription) { console.log('No subscription found for user:', userId); return }

  console.log('Subscription found, sending push...')
  try {
    await webpush.sendNotification(
      subRow.subscription,
      JSON.stringify({ title, body, url }),
      { urgency: 'high' }
    )
    console.log('Push sent OK')
  } catch (pushErr) {
    console.error('Push send FAILED:', pushErr)
  }
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const { table, record, old_record } = payload

    if (table === 'orders') {
      const newStatus = record?.status
      const oldStatus = old_record?.status
      if (!newStatus || newStatus === oldStatus || !record?.user_id) return new Response('ok')

      const msg = STATUS_MSG[newStatus]
      if (!msg) return new Response('ok')

      await sendPush(record.user_id, msg.title, msg.body, '/app/pedidos')

    } else if (table === 'top_up_requests') {
      if (!record?.user_id) return new Response('ok')
      const newStatus = record?.status
      const oldStatus = old_record?.status
      if (!newStatus || newStatus === oldStatus) return new Response('ok')

      const amount = Number(record.amount || 0).toFixed(2)

      if (newStatus === 'approved') {
        await sendPush(
          record.user_id,
          '💰 Saldo acreditado',
          `Se cargaron Bs ${amount} a tu billetera. ¡A pedir!`,
          '/app/wallet'
        )
      } else if (newStatus === 'rejected') {
        const reason = record.rejection_reason ? `: ${record.rejection_reason}` : ''
        await sendPush(
          record.user_id,
          '❌ Recarga rechazada',
          `Tu solicitud de Bs ${amount} fue rechazada${reason}.`,
          '/app/wallet'
        )
      }
    }
  } catch (err) {
    console.error('notify-user error:', err)
  }

  return new Response('ok', { status: 200 })
})
