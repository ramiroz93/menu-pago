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

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record?.id) return new Response('ok')

    const requestId = record.id
    const reloadNum = record.reload_number ? `#${record.reload_number}` : ''
    const amount = Number(record.amount || 0).toFixed(2)

    const { data: user } = await supabaseAdmin
      .from('profiles').select('full_name')
      .eq('id', record.user_id).maybeSingle()
    const userName = user?.full_name || 'Usuario'

    await sleep(20000)

    const { data: check } = await supabaseAdmin
      .from('top_up_requests').select('status').eq('id', requestId).single()

    if (check?.status !== 'pending') return new Response('ok - handled')

    const { data: admins } = await supabaseAdmin
      .from('profiles').select('id').eq('role', 'admin')

    for (const admin of (admins || [])) {
      const { data: subRow } = await supabaseAdmin
        .from('push_subscriptions').select('subscription')
        .eq('user_id', admin.id).maybeSingle()

      if (!subRow?.subscription) continue

      await webpush.sendNotification(
        subRow.subscription,
        JSON.stringify({
          title: `⚠️ RECARGA ${reloadNum} PENDIENTE`,
          body: `${userName} solicita Bs ${amount}. ¡Revísala ahora!`,
          url: '/admin/recargas',
          admin_urgent: true,
        }),
        { urgency: 'high' }
      )
    }
  } catch (err) {
    console.error('remind-admin error:', err)
  }

  return new Response('ok', { status: 200 })
})
