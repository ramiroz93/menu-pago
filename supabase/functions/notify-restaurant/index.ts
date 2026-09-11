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

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record // new order row

    if (!record?.restaurant_id) return new Response('ok')

    // Find the restaurant owner
    const { data: owner } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('restaurant_id', record.restaurant_id)
      .eq('role', 'restaurant')
      .maybeSingle()

    if (!owner?.id) return new Response('no owner')

    // Get their push subscription
    const { data: subRow } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', owner.id)
      .maybeSingle()

    if (!subRow?.subscription) return new Response('no subscription')

    const items = Array.isArray(record.items) ? record.items : []
    const itemCount = items.reduce((sum: number, i: { qty?: number }) => sum + (i.qty || 1), 0)

    const orderNum = record.order_number ? `#${record.order_number} · ` : ''
    await webpush.sendNotification(
      subRow.subscription,
      JSON.stringify({
        title: `🔔 NUEVO PEDIDO ${record.order_number ? '#' + record.order_number : ''}`,
        body: `${orderNum}Bs ${Number(record.total).toFixed(2)} · ${itemCount} ${itemCount === 1 ? 'unidad' : 'unidades'}`,
        url: '/restaurante/pedidos',
        urgent: true,
      }),
      { urgency: 'high' }
    )
  } catch (err) {
    console.error('notify-restaurant error:', err)
  }

  return new Response('ok', { status: 200 })
})
