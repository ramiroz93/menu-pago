// ══════════════════════════════════════════════════════════════════════════
// DEMO DE PORTFOLIO — este archivo reemplaza al cliente real de Supabase.
// En el sistema original esto era `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
// conectado a una base de datos Postgres real. Acá, en cambio, imita la misma
// interfaz (`.from()`, `.rpc()`, `.auth`, `.storage`, `.channel()`) pero todo
// corre en memoria, en el navegador, con datos ficticios — sin backend real,
// sin credenciales, sin red. Cualquier cambio que hagas en la demo (crear un
// pedido, aprobar una recarga, subir una foto de plato) se guarda solo en la
// pestaña abierta y se pierde al recargar la página.
// ══════════════════════════════════════════════════════════════════════════

function genId(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function placeholderImage(texto, bg, fg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="22" fill="${fg}">${texto}</text>
  </svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

const HORARIO_SIEMPRE_ABIERTO = {
  dom: { open: '08:00', close: '23:00' }, lun: { open: '08:00', close: '23:00' },
  mar: { open: '08:00', close: '23:00' }, mie: { open: '08:00', close: '23:00' },
  jue: { open: '08:00', close: '23:00' }, vie: { open: '08:00', close: '23:00' },
  sab: { open: '08:00', close: '23:00' },
}

// ── Datos ficticios ──
const DEMO_PROFILES = [
  { id: 'demo-user', full_name: 'Ana Cliente', email: 'cliente@demo.com', phone: '70011223', role: 'user', wallet_balance: 85.5, city: 'Santa Cruz' },
  { id: 'demo-restaurant', full_name: 'Carlos Restaurante', email: 'restaurante@demo.com', phone: '70022334', role: 'restaurant', restaurant_id: 'rest-1', wallet_balance: 0 },
  { id: 'demo-admin', full_name: 'Admin Demo', email: 'admin@demo.com', phone: '70000000', role: 'admin', wallet_balance: 0 },
  { id: 'user-2', full_name: 'Luis Fernández', email: 'luis@demo.com', phone: '70055667', role: 'user', wallet_balance: 32, city: 'Santa Cruz' },
  { id: 'user-3', full_name: 'María Paz', email: 'maria@demo.com', phone: '70088990', role: 'user', wallet_balance: 0, city: 'La Paz' },
]

const DEMO_RESTAURANTS = [
  {
    id: 'rest-1', name: 'Sabor Cruceño', categories: ['Comida rápida', 'Parrilla'], category: 'Comida rápida',
    city: 'Santa Cruz', is_active: true, is_open: true, rating: 4.6, rating_count: 38, consumption_balance: 250,
    whatsapp: '00000000000', logo: placeholderImage('Sabor Cruceño', '#D9480F', '#fff'), cover_image: placeholderImage('Sabor Cruceño', '#D9480F', '#fff'),
    logo_url: placeholderImage('Sabor Cruceño', '#D9480F', '#fff'), cover_url: placeholderImage('Sabor Cruceño', '#D9480F', '#fff'),
    accepts_pickup: true, sort_order: 1, address: 'Av. San Martín #450, Santa Cruz', maps: 'https://maps.google.com',
    schedule: HORARIO_SIEMPRE_ABIERTO,
  },
  {
    id: 'rest-2', name: 'Pizza Bella', categories: ['Pizza', 'Italiana'], category: 'Pizza',
    city: 'Santa Cruz', is_active: true, is_open: true, rating: 4.3, rating_count: 21, consumption_balance: 180,
    whatsapp: '00000000000', logo: placeholderImage('Pizza Bella', '#B91C1C', '#fff'), cover_image: placeholderImage('Pizza Bella', '#B91C1C', '#fff'),
    logo_url: placeholderImage('Pizza Bella', '#B91C1C', '#fff'), cover_url: placeholderImage('Pizza Bella', '#B91C1C', '#fff'),
    accepts_pickup: true, sort_order: null, address: 'Calle Ballivián #88, Santa Cruz', maps: 'https://maps.google.com',
    schedule: HORARIO_SIEMPRE_ABIERTO,
  },
  {
    id: 'rest-3', name: 'Sushi Go', categories: ['Sushi', 'Asiática'], category: 'Sushi',
    city: 'La Paz', is_active: true, is_open: true, rating: 4.8, rating_count: 54, consumption_balance: 300,
    whatsapp: '00000000000', logo: placeholderImage('Sushi Go', '#1E1E24', '#fff'), cover_image: placeholderImage('Sushi Go', '#1E1E24', '#fff'),
    logo_url: placeholderImage('Sushi Go', '#1E1E24', '#fff'), cover_url: placeholderImage('Sushi Go', '#1E1E24', '#fff'),
    accepts_pickup: false, sort_order: null, address: 'Av. Arce #1200, La Paz', maps: 'https://maps.google.com',
    schedule: HORARIO_SIEMPRE_ABIERTO,
  },
]

const DEMO_MENU_ITEMS = [
  { id: 'item-1', restaurant_id: 'rest-1', name: 'Hamburguesa Cruceña', description: 'Doble carne, queso y salsa de la casa', price: 35, category: 'Comida rápida', image: placeholderImage('Hamburguesa', '#EA580C', '#fff'), is_available: true, sort_order: 1 },
  { id: 'item-2', restaurant_id: 'rest-1', name: 'Papas Fritas', description: 'Porción grande con especias', price: 15, category: 'Comida rápida', image: placeholderImage('Papas Fritas', '#F59E0B', '#fff'), is_available: true, sort_order: 2 },
  { id: 'item-3', restaurant_id: 'rest-1', name: 'Pollo a la Parrilla', description: 'Con ensalada y arroz', price: 45, category: 'Parrilla', image: placeholderImage('Pollo Parrilla', '#B45309', '#fff'), is_available: true, sort_order: 3 },
  { id: 'item-4', restaurant_id: 'rest-1', name: 'Limonada', description: 'Vaso grande, bien helada', price: 10, category: 'Comida rápida', image: placeholderImage('Limonada', '#65A30D', '#fff'), is_available: true, sort_order: 4 },
  { id: 'item-5', restaurant_id: 'rest-1', name: 'Brownie con Helado', description: 'Brownie tibio con una bocha de vainilla', price: 12, category: 'Comida rápida', image: placeholderImage('Brownie', '#78350F', '#fff'), is_available: true, sort_order: 5 },
  { id: 'item-6', restaurant_id: 'rest-2', name: 'Pizza Muzzarella', description: 'Clásica, masa fina', price: 40, category: 'Pizza', image: placeholderImage('Pizza Muzzarella', '#B91C1C', '#fff'), is_available: true, sort_order: 1 },
  { id: 'item-7', restaurant_id: 'rest-2', name: 'Pizza Pepperoni', description: 'Doble pepperoni', price: 45, category: 'Pizza', image: placeholderImage('Pizza Pepperoni', '#991B1B', '#fff'), is_available: true, sort_order: 2 },
  { id: 'item-8', restaurant_id: 'rest-2', name: 'Calzone', description: 'Relleno de jamón y queso', price: 38, category: 'Italiana', image: placeholderImage('Calzone', '#7F1D1D', '#fff'), is_available: true, sort_order: 3 },
  { id: 'item-9', restaurant_id: 'rest-3', name: 'Sushi California 8pz', description: 'Palta, queso crema, kanikama', price: 55, category: 'Sushi', image: placeholderImage('Sushi California', '#1E1E24', '#fff'), is_available: true, sort_order: 1 },
  { id: 'item-10', restaurant_id: 'rest-3', name: 'Ramen', description: 'Caldo casero, chashu y huevo', price: 48, category: 'Asiática', image: placeholderImage('Ramen', '#3F3F46', '#fff'), is_available: true, sort_order: 2 },
  { id: 'item-11', restaurant_id: 'rest-3', name: 'Gyozas', description: '6 unidades, salsa de soya', price: 25, category: 'Asiática', image: placeholderImage('Gyozas', '#52525B', '#fff'), is_available: true, sort_order: 3 },
]

const hace = (dias) => new Date(Date.now() - dias * 86400000).toISOString()

const DEMO_ORDERS = [
  {
    id: 'order-1', order_number: 1001, user_id: 'demo-user', restaurant_id: 'rest-1', status: 'completed',
    subtotal: 50, total: 42.5, balance_before: 128, user_balance_before: 128,
    items: [{ id: 'item-1', name: 'Hamburguesa Cruceña', price: 35, quantity: 1 }, { id: 'item-2', name: 'Papas Fritas', price: 15, quantity: 1 }],
    notes: null, delivery_location: { name: 'Casa', maps_url: 'https://maps.google.com' }, pickup: false,
    rejection_reason: null, estimated_minutes: 30, created_at: hace(4), confirmed_at: hace(4),
  },
  {
    id: 'order-2', order_number: 1002, user_id: 'demo-user', restaurant_id: 'rest-1', status: 'pending',
    subtotal: 45, total: 38.25, balance_before: 85.5, user_balance_before: 85.5,
    items: [{ id: 'item-3', name: 'Pollo a la Parrilla', price: 45, quantity: 1 }],
    notes: 'Sin cebolla por favor', delivery_location: { name: 'Casa', maps_url: 'https://maps.google.com' }, pickup: false,
    rejection_reason: null, estimated_minutes: null, created_at: hace(0), confirmed_at: null,
  },
]

const DEMO_RATINGS = [
  { id: 'rating-1', user_id: 'demo-user', restaurant_id: 'rest-1', rating: 5 },
]

const DEMO_USER_LOCATIONS = [
  { id: 'loc-1', user_id: 'demo-user', city: 'Santa Cruz', name: 'Casa', maps_url: 'https://maps.google.com', created_at: hace(20) },
]

const DEMO_CITIES = [{ name: 'Santa Cruz', is_active: true }, { name: 'La Paz', is_active: true }, { name: 'Cochabamba', is_active: true }]
const DEMO_CATEGORIES = ['Comida rápida', 'Parrilla', 'Pizza', 'Italiana', 'Sushi', 'Asiática'].map((name) => ({ name }))
const DEMO_FAVORITES = [{ id: 'fav-1', user_id: 'demo-user', restaurant_id: 'rest-1' }]

const DEMO_TOP_UP_REQUESTS = [
  { id: 'topup-1', user_id: 'demo-user', amount: 100, bonus_amount: 5, total_credited: 105, status: 'approved', rejection_reason: null, created_at: hace(15) },
  { id: 'topup-2', user_id: 'user-2', amount: 200, bonus_amount: 10, total_credited: 210, status: 'pending', rejection_reason: null, created_at: hace(0) },
]

const DEMO_DELIVERY_COMPANIES = [
  { id: 'delivery-1', name: 'Envíos Rápidos BO', whatsapp: '00000000000' },
]

const DEMO_CONSUMPTION_BALANCE_LOGS = [
  { id: 'cbl-1', restaurant_id: 'rest-1', amount: 250, note: 'Carga inicial', created_at: hace(30) },
]

const DEMO_PUSH_SUBSCRIPTIONS = []

const DEMO_TABLES = {
  profiles: DEMO_PROFILES,
  restaurants: DEMO_RESTAURANTS,
  menu_items: DEMO_MENU_ITEMS,
  orders: DEMO_ORDERS,
  ratings: DEMO_RATINGS,
  user_locations: DEMO_USER_LOCATIONS,
  cities: DEMO_CITIES,
  categories: DEMO_CATEGORIES,
  favorites: DEMO_FAVORITES,
  top_up_requests: DEMO_TOP_UP_REQUESTS,
  push_subscriptions: DEMO_PUSH_SUBSCRIPTIONS,
  delivery_companies: DEMO_DELIVERY_COMPANIES,
  consumption_balance_logs: DEMO_CONSUMPTION_BALANCE_LOGS,
}

// ── Sesión demo (a quién está "logueado" en esta pestaña) ──
let _currentUserId = null
export function loginComoDemo(role) {
  const map = { user: 'demo-user', restaurant: 'demo-restaurant', admin: 'demo-admin' }
  const id = map[role]
  _currentUserId = id
  return DEMO_PROFILES.find((p) => p.id === id)
}
function currentProfile() {
  return DEMO_PROFILES.find((p) => p.id === _currentUserId) || null
}

// ── Query builder genérico (imita el cliente de Supabase, sin red) ──
function matchesFilters(row, filters) {
  return filters.every((f) => {
    if (f.t === 'eq') return row[f.field] === f.val
    if (f.t === 'neq') return row[f.field] !== f.val
    if (f.t === 'gte') return row[f.field] >= f.val
    if (f.t === 'lte') return row[f.field] <= f.val
    if (f.t === 'in') return f.vals.includes(row[f.field])
    if (f.t === 'ilike') {
      const needle = String(f.pattern).replace(/%/g, '').toLowerCase()
      return String(row[f.field] || '').toLowerCase().includes(needle)
    }
    if (f.t === 'or') {
      return f.clauses.some((c) => {
        const [field, op, val] = c.split('.')
        if (op === 'ilike') return String(row[field] || '').toLowerCase().includes(String(val).replace(/%/g, '').toLowerCase())
        return false
      })
    }
    return true
  })
}

function joinRow(table, row, selectStr) {
  let out = row
  const sel = selectStr || ''
  if ((table === 'menu_items' || table === 'orders') && sel.includes('restaurants(')) {
    out = { ...out, restaurants: DEMO_RESTAURANTS.find((r) => r.id === row.restaurant_id) || null }
  }
  if (table === 'orders' && sel.includes('profiles(')) {
    out = { ...out, profiles: DEMO_PROFILES.find((p) => p.id === row.user_id) || null }
  }
  if (table === 'top_up_requests' && sel.includes('profiles(')) {
    out = { ...out, profiles: DEMO_PROFILES.find((p) => p.id === row.user_id) || null }
  }
  return out
}

function makeQuery(table) {
  const rowsRef = DEMO_TABLES[table] || []
  const st = { filters: [], orders: [], limitN: null, single: false, maybeSingle: false, op: null, payload: null, selectStr: '' }

  const api = {
    select(str) { st.selectStr = str || ''; return api },
    eq(field, val) { st.filters.push({ t: 'eq', field, val }); return api },
    neq(field, val) { st.filters.push({ t: 'neq', field, val }); return api },
    gte(field, val) { st.filters.push({ t: 'gte', field, val }); return api },
    lte(field, val) { st.filters.push({ t: 'lte', field, val }); return api },
    in(field, vals) { st.filters.push({ t: 'in', field, vals }); return api },
    ilike(field, pattern) { st.filters.push({ t: 'ilike', field, pattern }); return api },
    or(str) { st.filters.push({ t: 'or', clauses: str.split(',') }); return api },
    order(field, opts) { st.orders.push({ field, asc: !(opts && opts.ascending === false) }); return api },
    limit(n) { st.limitN = n; return api },
    single() { st.single = true; return api },
    maybeSingle() { st.maybeSingle = true; return api },
    insert(payload) { st.op = 'insert'; st.payload = payload; return api },
    update(payload) { st.op = 'update'; st.payload = payload; return api },
    upsert(payload) { st.op = 'upsert'; st.payload = payload; return api },
    delete() { st.op = 'delete'; return api },
    then(resolve, reject) {
      return new Promise((res) => {
        setTimeout(() => {
          try {
            res(resolve(resolveQuery(table, rowsRef, st)))
          } catch (e) {
            if (reject) res(reject(e)); else throw e
          }
        }, 0)
      })
    },
  }
  return api
}

function resolveQuery(table, rowsRef, st) {
  if (st.op === 'insert') {
    const rows = Array.isArray(st.payload) ? st.payload : [st.payload]
    const inserted = rows.map((p) => ({ id: genId(table), created_at: new Date().toISOString(), ...p }))
    inserted.forEach((r) => rowsRef.push(r))
    if (st.single) return { data: inserted[0], error: null }
    return { data: inserted, error: null }
  }
  if (st.op === 'upsert') {
    const payload = st.payload
    const idField = payload.id !== undefined ? 'id' : (payload.user_id !== undefined ? 'user_id' : 'id')
    const existing = rowsRef.find((r) => r[idField] === payload[idField])
    if (existing) { Object.assign(existing, payload); return { data: st.single ? existing : [existing], error: null } }
    const row = { id: genId(table), created_at: new Date().toISOString(), ...payload }
    rowsRef.push(row)
    return { data: st.single ? row : [row], error: null }
  }
  if (st.op === 'update') {
    const matched = rowsRef.filter((r) => matchesFilters(r, st.filters))
    matched.forEach((r) => Object.assign(r, st.payload))
    return { data: matched, error: null }
  }
  if (st.op === 'delete') {
    const toDelete = rowsRef.filter((r) => matchesFilters(r, st.filters))
    toDelete.forEach((r) => { const i = rowsRef.indexOf(r); if (i >= 0) rowsRef.splice(i, 1) })
    return { data: null, error: null }
  }
  // select
  let rows = rowsRef.filter((r) => matchesFilters(r, st.filters)).map((r) => joinRow(table, r, st.selectStr))
  st.orders.slice().reverse().forEach((o) => {
    rows.sort((a, b) => {
      const av = a[o.field], bv = b[o.field]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av === bv) return 0
      return o.asc ? (av > bv ? 1 : -1) : (av > bv ? -1 : 1)
    })
  })
  if (st.limitN != null) rows = rows.slice(0, st.limitN)
  if (st.single) return rows.length ? { data: rows[0], error: null } : { data: null, error: { message: 'No encontrado' } }
  if (st.maybeSingle) return { data: rows[0] || null, error: null }
  return { data: rows, error: null }
}

// ── RPCs (funciones de backend) ──
function rpc(name, params = {}) {
  return new Promise((resolveP) => {
    setTimeout(() => {
      const me = currentProfile()
      let result = { data: null, error: null }

      if (name === 'place_order') {
        if (!me) { result = { data: { error: 'No autenticado' }, error: null } }
        else {
          const DISC = 0.15
          const items = (params.p_items || []).map((it) => {
            const mi = DEMO_MENU_ITEMS.find((m) => m.id === it.id)
            return { id: it.id, name: mi?.name || 'Producto', price: mi?.price || 0, quantity: it.quantity }
          })
          const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
          const total = Math.round(subtotal * (1 - DISC) * 100) / 100
          if (me.wallet_balance < total) {
            result = { data: { error: 'Saldo insuficiente' }, error: null }
          } else {
            const order = {
              id: genId('order'), order_number: 1000 + DEMO_ORDERS.length + 1,
              user_id: me.id, restaurant_id: params.p_restaurant_id, status: 'pending',
              subtotal, total, balance_before: me.wallet_balance, user_balance_before: me.wallet_balance,
              items, notes: params.p_notes || null, delivery_location: params.p_delivery_location || null,
              pickup: !!params.p_delivery_location?.pickup, rejection_reason: null, estimated_minutes: null,
              created_at: new Date().toISOString(), confirmed_at: null,
            }
            DEMO_ORDERS.push(order)
            me.wallet_balance = Math.round((me.wallet_balance - total) * 100) / 100
            result = { data: { success: true, order_id: order.id }, error: null }
          }
        }
      } else if (name === 'rate_restaurant') {
        if (me) {
          let r = DEMO_RATINGS.find((x) => x.user_id === me.id && x.restaurant_id === params.p_restaurant_id)
          if (r) r.rating = params.p_rating
          else DEMO_RATINGS.push({ id: genId('rating'), user_id: me.id, restaurant_id: params.p_restaurant_id, rating: params.p_rating })
          const forRest = DEMO_RATINGS.filter((x) => x.restaurant_id === params.p_restaurant_id)
          const rest = DEMO_RESTAURANTS.find((x) => x.id === params.p_restaurant_id)
          if (rest) {
            rest.rating_count = forRest.length
            rest.rating = Math.round((forRest.reduce((s, x) => s + x.rating, 0) / forRest.length) * 10) / 10
          }
        }
      } else if (name === 'update_own_profile') {
        if (me) { me.full_name = params.p_full_name; me.phone = params.p_phone; me.city = params.p_city }
      } else if (name === 'toggle_restaurant_open') {
        const rest = DEMO_RESTAURANTS.find((r) => r.id === me?.restaurant_id)
        if (rest) { rest.is_open = !rest.is_open; result = { data: rest.is_open, error: null } }
      } else if (name === 'refund_order') {
        const order = DEMO_ORDERS.find((o) => o.id === params.order_id)
        if (order) { const u = DEMO_PROFILES.find((p) => p.id === order.user_id); if (u) u.wallet_balance = Math.round((u.wallet_balance + Number(order.total)) * 100) / 100 }
      } else if (name === 'admin_adjust_balance') {
        const u = DEMO_PROFILES.find((p) => p.id === params.p_user_id)
        if (u) { u.wallet_balance = Math.max(0, Math.round((Number(u.wallet_balance) + Number(params.p_delta)) * 100) / 100); result = { data: u.wallet_balance, error: null } }
      } else if (name === 'admin_assign_access') {
        const u = DEMO_PROFILES.find((p) => p.id === params.p_user_id)
        if (u) { u.role = params.p_role; u.restaurant_id = params.p_restaurant_id || null }
      } else if (name === 'credit_top_up') {
        const req = DEMO_TOP_UP_REQUESTS.find((r) => r.id === params.p_request_id)
        if (req && req.status === 'pending') {
          req.status = 'approved'
          const u = DEMO_PROFILES.find((p) => p.id === req.user_id)
          if (u) u.wallet_balance = Math.round((Number(u.wallet_balance) + Number(req.total_credited)) * 100) / 100
        }
      } else if (name === 'set_restaurant_schedule') {
        const rest = DEMO_RESTAURANTS.find((r) => r.id === me?.restaurant_id)
        if (rest) rest.schedule = params.p_schedule
      } else if (name === 'admin_add_consumption_balance') {
        const rest = DEMO_RESTAURANTS.find((r) => r.id === params.p_restaurant_id)
        if (rest) {
          rest.consumption_balance = Math.round((Number(rest.consumption_balance) + Number(params.p_amount)) * 100) / 100
          DEMO_CONSUMPTION_BALANCE_LOGS.unshift({ id: genId('cbl'), restaurant_id: params.p_restaurant_id, amount: params.p_amount, note: params.p_note || null, created_at: new Date().toISOString() })
        }
      } else if (name === 'admin_create_restaurant_access') {
        DEMO_PROFILES.push({ id: genId('profile'), full_name: 'Encargado', email: params.p_email, phone: '', role: 'restaurant', restaurant_id: params.p_restaurant_id, wallet_balance: 0 })
      } else if (name === 'admin_delete_restaurant_user') {
        for (let i = DEMO_PROFILES.length - 1; i >= 0; i--) {
          if (DEMO_PROFILES[i].restaurant_id === params.p_restaurant_id && DEMO_PROFILES[i].role === 'restaurant') DEMO_PROFILES.splice(i, 1)
        }
      }

      resolveP(result)
    }, 150)
  })
}

// ── Storage (fotos de platos/restaurantes) — usa URLs locales del navegador, sin subir nada ──
const _storageBlobs = {}
const storage = {
  from() {
    return {
      async upload(filename, blob) { _storageBlobs[filename] = blob; return { error: null } },
      getPublicUrl(filename) { return { data: { publicUrl: _storageBlobs[filename] ? URL.createObjectURL(_storageBlobs[filename]) : '' } } },
      async remove(filenames) { filenames.forEach((f) => delete _storageBlobs[f]); return { error: null } },
    }
  },
}

// ── Canales en tiempo real (no-op: la demo no tiene backend con el que sincronizar) ──
function channel() {
  const chan = { on() { return chan }, subscribe() { return chan }, unsubscribe() {} }
  return chan
}

// ── Auth demo: sin backend real, el "login" lo maneja loginComoDemo() desde Login.jsx ──
const auth = {
  async getSession() { return { data: { session: null } } },
  async getUser() { return { data: { user: null } } },
  onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } },
  async signOut() { _currentUserId = null; return { error: null } },
  async signInWithPassword() { return { error: { message: 'Usa los accesos de demo en la pantalla de login' } } },
  async signUp() { return { data: null, error: { message: 'Registro deshabilitado en la demo' } } },
  async resetPasswordForEmail() { return { error: null } },
  async exchangeCodeForSession() { return { error: null } },
  async updateUser() { return { error: null } },
}

export const supabase = {
  from: makeQuery,
  rpc,
  auth,
  storage,
  channel,
  removeChannel() {},
}
