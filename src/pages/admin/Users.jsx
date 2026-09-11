import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Store, UserCircle } from 'lucide-react'
import { supabase } from '../../config/supabase'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { APP_CONFIG } from '../../config/app.config'

function AdjustModal({ user, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('add')
  const [saving, setSaving] = useState(false)

  const delta = parseFloat(amount) || 0
  const preview = Math.max(0, Number(user.wallet_balance) + (mode === 'add' ? delta : -delta))

  const handleSave = async () => {
    if (!delta || delta <= 0) return
    setSaving(true)
    const { data, error } = await supabase.rpc('admin_adjust_balance', {
      p_user_id: user.id,
      p_delta: mode === 'add' ? delta : -delta,
    })
    if (error) alert('Error: ' + error.message)
    else onSave(user.id, data)
    setSaving(false)
  }

  return (
    <Modal title="Ajustar saldo" onClose={onClose}>
      <p className="text-sm text-gray-500 -mt-1">{user.full_name}</p>
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-xs text-gray-400">Saldo actual</p>
        <p className="text-2xl font-bold text-dark">{APP_CONFIG.currency} {Number(user.wallet_balance).toFixed(2)}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setMode('add')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-colors
            ${mode === 'add' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
          <Plus size={14} /> Acreditar
        </button>
        <button onClick={() => setMode('sub')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-colors
            ${mode === 'sub' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
          <Minus size={14} /> Descontar
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium text-gray-600 flex-shrink-0">{APP_CONFIG.currency}</span>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00" min="0" step="0.50" autoFocus
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      {delta > 0 && (
        <div className="bg-gray-50 rounded-xl p-2.5 text-center text-sm text-gray-600">
          Nuevo saldo: <span className="font-bold text-dark">{APP_CONFIG.currency} {preview.toFixed(2)}</span>
        </div>
      )}
      <button onClick={handleSave} disabled={saving || delta <= 0}
        className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 text-white
          ${mode === 'add' ? 'bg-green-500' : 'bg-red-500'}`}>
        {saving ? <Spinner size="sm" /> : `${mode === 'add' ? 'Acreditar' : 'Descontar'} ${APP_CONFIG.currency} ${delta.toFixed(2)}`}
      </button>
    </Modal>
  )
}

function AccessModal({ user, restaurants, onSave, onClose }) {
  const [role, setRole] = useState(user.role || 'user')
  const [restaurantId, setRestaurantId] = useState(user.restaurant_id || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (role === 'restaurant' && !restaurantId) {
      alert('Selecciona un restaurante')
      return
    }
    setSaving(true)
    const { error } = await supabase.rpc('admin_assign_access', {
      p_user_id: user.id,
      p_role: role,
      p_restaurant_id: role === 'restaurant' ? restaurantId : null,
    })
    if (error) alert('Error: ' + error.message)
    else onSave(user.id, role, role === 'restaurant' ? restaurantId : null)
    setSaving(false)
  }

  return (
    <Modal title="Acceso del usuario" onClose={onClose}>
      <p className="text-sm text-gray-500 -mt-1">{user.full_name} · {user.email}</p>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Rol</p>
        <div className="flex gap-2">
          <button onClick={() => setRole('user')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-colors
              ${role === 'user' ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-500 border-gray-200'}`}>
            <UserCircle size={16} /> Usuario
          </button>
          <button onClick={() => setRole('restaurant')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-colors
              ${role === 'restaurant' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'}`}>
            <Store size={16} /> Restaurante
          </button>
        </div>
      </div>

      {role === 'restaurant' && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Asignar al local</p>
          <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Seleccionar restaurante...</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {restaurantId && (
            <p className="text-[10px] text-gray-400 mt-1">
              Este usuario podrá gestionar pedidos, menú y ventas de ese local.
            </p>
          )}
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {saving ? <Spinner size="sm" /> : 'Guardar acceso'}
      </button>
    </Modal>
  )
}

const initials = (name) => (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

const ROLE_BADGE = {
  user:       'bg-gray-100 text-gray-500',
  restaurant: 'bg-orange-100 text-orange-600',
  admin:      'bg-purple-100 text-purple-600',
}
const ROLE_LABEL = { user: 'Usuario', restaurant: 'Restaurante', admin: 'Admin' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('users')
  const [selected, setSelected] = useState(null)
  const [accessUser, setAccessUser] = useState(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: profiles }, { data: rests }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, phone, wallet_balance, role, restaurant_id').neq('role', 'admin').order('full_name'),
        supabase.from('restaurants').select('id, name').order('name'),
      ])
      setUsers(profiles || [])
      setRestaurants(rests || [])
      setLoading(false)
    }
    load()
  }, [])

  const onlyUsers = users.filter((u) => u.role === 'user')
  const onlyRestaurants = users.filter((u) => u.role === 'restaurant')
  const activeList = tab === 'users' ? onlyUsers : onlyRestaurants

  const filtered = activeList.filter((u) => {
    const q = search.toLowerCase()
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q)
  })

  const handleAdjust = (userId, newBalance) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, wallet_balance: newBalance } : u))
    setSelected(null)
  }

  const handleAccess = (userId, newRole, newRestaurantId) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole, restaurant_id: newRestaurantId } : u))
    setAccessUser(null)
  }

  const totalBalance = onlyUsers.reduce((s, u) => s + Number(u.wallet_balance || 0), 0)
  const restaurantName = (id) => restaurants.find((r) => r.id === id)?.name

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white px-4 pt-14 pb-0 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-dark">Usuarios</h1>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Saldo total en circulación</p>
            <p className="text-sm font-bold text-primary-500">{APP_CONFIG.currency} {totalBalance.toFixed(2)}</p>
          </div>
        </div>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex border-b border-gray-100">
          {[['users', 'Usuarios', onlyUsers.length], ['restaurants', 'Restaurantes', onlyRestaurants.length]].map(([k, l, count]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${tab === k ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-400'}`}>
              {l}
              <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {search ? 'Sin resultados' : tab === 'users' ? 'Sin usuarios registrados' : 'Sin cuentas de restaurante'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${u.role === 'restaurant' ? 'bg-orange-100' : 'bg-primary-100'}`}>
                  <span className={`font-bold text-sm ${u.role === 'restaurant' ? 'text-orange-600' : 'text-primary-600'}`}>{initials(u.full_name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark text-sm truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  {u.role === 'restaurant' && u.restaurant_id && (
                    <p className="text-[11px] text-orange-500 font-medium">{restaurantName(u.restaurant_id)}</p>
                  )}
                  {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                </div>
                <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                  {u.role === 'user' && (
                    <button onClick={() => setSelected(u)}
                      className="text-[10px] font-bold text-primary-500 bg-primary-50 px-2 py-1 rounded-lg">
                      {APP_CONFIG.currency} {Number(u.wallet_balance).toFixed(2)}
                    </button>
                  )}
                  <button onClick={() => setAccessUser(u)}
                    className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Store size={10} /> Acceso
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <AdjustModal user={selected} onSave={handleAdjust} onClose={() => setSelected(null)} />}
      {accessUser && <AccessModal user={accessUser} restaurants={restaurants} onSave={handleAccess} onClose={() => setAccessUser(null)} />}
    </div>
  )
}
