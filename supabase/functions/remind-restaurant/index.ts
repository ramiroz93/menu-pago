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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function sendPushTo(userId: string, payload: object) {
  const { data: subRow } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .maybeSingle()
  if (!subRow?.subscription) return
  try {
    await webpush.sendNotification(
      subRow.subscription,
      JSON.stringify(payload),
      { urgency: 'high' }
    )
  } catch (_) {}
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record?.id || !record?.restaurant_id) return new Response('ok')

    const orderId = record.id
    const restaurantId = record.restaurant_id
    const orderNum = record.order_number ? `#${record.order_number}` : ''

    // --- Wait 20 seconds, then re-notify restaurant if still pending ---
    await sleep(20000)

    const { data: check1 } = await supabaseAdmin
      .from('orders').select('status').eq('id', orderId).single()

    if (check1?.status !== 'pending') return new Response('ok - handled')

    const { data: owner } = await supabaseAdmin
      .from('profiles').select('id')
      .eq('restaurant_id', restaurantId).eq('role', 'restaurant').maybeSingle()

    if (owner?.id) {
      await sendPushTo(owner.id, {
        title: `⚠️ PEDIDO ${orderNum} SIN ATENDER`,
        body: '¡Tienes un pedido pendiente! Revísalo ahora.',
        url: '/restaurante/pedidos',
        urgent: true,
      })
    }

    // --- Wait 40 more seconds (total 60s), then notify admin ---
    await sleep(40000)

    const { data: check2 } = await supabaseAdmin
      .from('orders').select('status').eq('id', orderId).single()

    if (check2?.status !== 'pending') return new Response('ok - handled late')

    const { data: rest } = await supabaseAdmin
      .from('restaurants').select('name, whatsapp').eq('id', restaurantId).single()

    const { data: admins } = await supabaseAdmin
      .from('profiles').select('id').eq('role', 'admin')

    for (const admin of (admins || [])) {
      await sendPushTo(admin.id, {
        title: `⚠️ Pedido ${orderNum} sin atender`,
        body: `${rest?.name || 'Restaurante'} no responde hace 1 min. Contactar.`,
        url: '/admin/pedidos',
        admin_urgent: true,
      })
    }
  } catch (err) {
    console.error('remind-restaurant error:', err)
  }

  return new Response('ok', { status: 200 })
})
