import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Camera, X, Clock, Check, ChevronDown } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { APP_CONFIG } from '../../config/app.config'
import { uploadMenuImage, deleteMenuImage, uploadRestaurantImage } from '../../utils/imageUtils'
import { isRestaurantOpen } from '../../utils/scheduleUtils'
import InstallButton from '../../components/InstallButton'

function ItemModal({ item, restaurantId, onSave, onClose }) {
  const [form, setForm] = useState(item || { name: '', description: '', price: '', category: '', image: '', is_available: true })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadMenuImage(file, supabase, form.image)
      setForm((f) => ({ ...f, image: url }))
    } catch {
      alert('No se pudo subir la imagen. Intenta de nuevo.')
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    const payload = { ...form, price: Number(form.price), restaurant_id: restaurantId }
    if (item?.id) {
      await supabase.from('menu_items').update(payload).eq('id', item.id)
    } else {
      await supabase.from('menu_items').insert(payload)
    }
    onSave()
    setSaving(false)
  }

  return (
    <Modal title={item?.id ? 'Editar plato' : 'Nuevo plato'} onClose={onClose}>
      <input type="text" value={form.name || ''} onChange={set('name')} placeholder="Nombre del plato"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <input type="text" value={form.description || ''} onChange={set('description')} placeholder="Descripción (opcional)"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <select value={form.category || ''} onChange={set('category')}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
        <option value="">Seleccionar categoría</option>
        <option>Entrada</option>
        <option>Principal</option>
        <option>Bebida</option>
        <option>Postre</option>
        <option>Combo</option>
        <option>Otro</option>
      </select>

      {/* Foto del plato */}
      <div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        {form.image ? (
          <div className="relative">
            <img src={form.image} alt="preview" className="w-full h-36 object-cover rounded-xl" />
            <button onClick={() => { deleteMenuImage(form.image, supabase); setForm((f) => ({ ...f, image: '' })) }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
              <X size={14} />
            </button>
            <button onClick={() => fileRef.current.click()}
              className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
              <Camera size={12} /> Cambiar
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current.click()} disabled={uploading}
            className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary-300 hover:text-primary-400 transition-colors disabled:opacity-60">
            {uploading ? <Spinner size="sm" /> : <><Camera size={20} /><span className="text-xs">Subir foto del plato</span></>}
          </button>
        )}
        {uploading && <p className="text-xs text-primary-500 text-center mt-1">Comprimiendo y subiendo...</p>}
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium text-gray-600 flex-shrink-0">{APP_CONFIG.currency}</span>
        <input type="number" value={form.price} onChange={set('price')} placeholder="Precio" min="0"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <button onClick={handleSave} disabled={saving || uploading || !form.name || !form.price}
        className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {saving ? <Spinner size="sm" /> : 'Guardar plato'}
      </button>
    </Modal>
  )
}

const DIAS = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
]

const DEFAULT_SHIFT = { open: '10:00', close: '22:00' }
const DEFAULT_SCHEDULE = Object.fromEntries(
  DIAS.map(({ key }) => [key, [{ ...DEFAULT_SHIFT }]])
)

function normalizeSchedule(schedule) {
  if (!schedule) return null
  const out = {}
  for (const [key, val] of Object.entries(schedule)) {
    if (!val) out[key] = null
    else if (Array.isArray(val)) out[key] = val
    else out[key] = [val]
  }
  return out
}

function ScheduleEditor({ restaurantId, initialSchedule, onChange }) {
  const [schedule, setSchedule] = useState(normalizeSchedule(initialSchedule) || DEFAULT_SCHEDULE)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [open, setOpen] = useState(false)

  const toggleDay = (key) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: prev[key] ? null : [{ ...DEFAULT_SHIFT }],
    }))
  }

  const setTime = (key, idx, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: prev[key].map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }))
  }

  const addShift = (key) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: [...prev[key], { open: '18:00', close: '22:00' }],
    }))
  }

  const removeShift = (key, idx) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase.rpc('set_restaurant_schedule', { p_schedule: schedule })
    if (error) {
      setSaving(false)
      setSaveError('Error: ' + error.message)
      return
    }
    const { data } = await supabase.from('restaurants').select('schedule').eq('id', restaurantId).single()
    setSaving(false)
    onChange(data?.schedule || schedule)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm p-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-primary-500" />
          <p className="font-bold text-dark text-sm">Horario de atención</p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && <div className="space-y-3 mt-3"><div className="space-y-2">
        {DIAS.map(({ key, label }) => {
          const shifts = schedule[key]
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2">
                <button onClick={() => toggleDay(key)}
                  className={`w-8 h-5 rounded-full transition-colors flex-shrink-0 relative ${shifts ? 'bg-primary-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${shifts ? 'left-3.5' : 'left-0.5'}`} />
                </button>
                <span className={`text-xs font-medium w-20 flex-shrink-0 ${shifts ? 'text-dark' : 'text-gray-400'}`}>{label}</span>
                {!shifts && <span className="text-xs text-gray-400 flex-1">Cerrado</span>}
                {shifts && shifts.length < 2 && (
                  <button onClick={() => addShift(key)} className="text-[10px] text-primary-500 font-semibold ml-auto">+ Turno</button>
                )}
              </div>
              {shifts && shifts.map((shift, idx) => (
                <div key={idx} className="flex items-center gap-1.5 ml-10 pl-[80px]">
                  <input type="time" value={shift.open}
                    onChange={(e) => setTime(key, idx, 'open', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  <span className="text-gray-400 text-xs">-</span>
                  <input type="time" value={shift.close}
                    onChange={(e) => setTime(key, idx, 'close', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  {shifts.length > 1 && (
                    <button onClick={() => removeShift(key, idx)} className="text-red-400 text-xs font-bold px-1">×</button>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {saveError && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{saveError}</p>
      )}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-2.5 bg-primary-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {saving ? <Spinner size="sm" /> : saved ? <><Check size={15} /> Guardado</> : 'Guardar horario'}
      </button>
      </div>}
    </div>
  )
}

function RestaurantProfile({ restaurantId, onUpdated }) {
  const [restaurant, setRestaurant] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const logoRef = useRef()
  const coverRef = useRef()

  useEffect(() => {
    supabase.from('restaurants').select('name, logo_url, cover_url, logo, cover_image, schedule, is_open, accepts_pickup').eq('id', restaurantId).single()
      .then(({ data }) => setRestaurant(data))
  }, [restaurantId])

  const handleImage = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    type === 'logo' ? setUploadingLogo(true) : setUploadingCover(true)
    try {
      const oldUrl = type === 'logo'
        ? (restaurant?.logo_url || restaurant?.logo)
        : (restaurant?.cover_url || restaurant?.cover_image)
      const url = await uploadRestaurantImage(file, supabase, type, oldUrl)
      const field = type === 'logo' ? 'logo_url' : 'cover_url'
      await supabase.from('restaurants').update({ [field]: url }).eq('id', restaurantId)
      setRestaurant((r) => ({ ...r, [field]: url }))
      onUpdated()
    } catch {
      alert('No se pudo subir la imagen. Intenta de nuevo.')
    }
    type === 'logo' ? setUploadingLogo(false) : setUploadingCover(false)
  }

  if (!restaurant) return null

  const open = isRestaurantOpen(restaurant)

  return (
    <>
      <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Foto de portada */}
        <div className="relative h-28 bg-gray-100">
          {(restaurant.cover_url || restaurant.cover_image)
            ? <img src={restaurant.cover_url || restaurant.cover_image} alt="portada" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin foto de portada</div>
          }
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, 'cover')} />
          <button onClick={() => coverRef.current.click()} disabled={uploadingCover}
            className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            {uploadingCover ? <Spinner size="sm" /> : <><Camera size={12} /> {restaurant.cover_url ? 'Cambiar portada' : 'Subir portada'}</>}
          </button>
        </div>

        {/* Logo + nombre + estado */}
        <div className="px-4 pb-3 flex items-center gap-3 -mt-6">
          <div className="relative">
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, 'logo')} />
            <div className="w-14 h-14 rounded-xl border-2 border-white shadow bg-gray-100 overflow-hidden">
              {(restaurant.logo_url || restaurant.logo)
                ? <img src={restaurant.logo_url || restaurant.logo} alt="logo" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">🍴</div>
              }
            </div>
            <button onClick={() => logoRef.current.click()} disabled={uploadingLogo}
              className="absolute -bottom-1 -right-1 bg-primary-500 text-white rounded-full p-1 shadow">
              {uploadingLogo ? <Spinner size="sm" /> : <Camera size={10} />}
            </button>
          </div>
          <div className="mt-6">
            <p className="font-bold text-dark text-sm">{restaurant.name}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {open ? '● Abierto ahora' : '● Cerrado ahora'}
            </span>
          </div>
        </div>
      </div>

      <ScheduleEditor
        key={restaurant.schedule ? 'loaded' : 'empty'}
        restaurantId={restaurantId}
        initialSchedule={restaurant.schedule}
        onChange={(newSchedule) => {
          setRestaurant((r) => ({ ...r, schedule: newSchedule }))
          onUpdated()
        }}
      />

      <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-dark">Acepto pedidos para recoger</p>
            <p className="text-xs text-gray-400 mt-0.5">Los clientes podrán elegir recoger en local</p>
          </div>
          <button
            onClick={async () => {
              const newVal = !restaurant.accepts_pickup
              await supabase.from('restaurants').update({ accepts_pickup: newVal }).eq('id', restaurantId)
              setRestaurant((r) => ({ ...r, accepts_pickup: newVal }))
            }}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${restaurant.accepts_pickup ? 'bg-primary-500' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${restaurant.accepts_pickup ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <InstallButton />
      </div>
    </>
  )
}

export default function RestaurantMenu() {
  const { profile, clearMenuCache } = useStore()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [restaurantName, setRestaurantName] = useState('')

  const fetch = async () => {
    const [{ data }, { data: rest }] = await Promise.all([
      supabase.from('menu_items').select('*').eq('restaurant_id', profile.restaurant_id).order('sort_order', { ascending: true, nullsFirst: false }),
      supabase.from('restaurants').select('name').eq('id', profile.restaurant_id).single(),
    ])
    setItems(data || [])
    if (rest?.name) setRestaurantName(rest.name)
    setLoading(false)
  }

  useEffect(() => { if (profile?.restaurant_id) fetch() }, [profile?.restaurant_id])

  const toggleAvailable = async (item) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
    clearMenuCache(profile.restaurant_id)
  }

  const deleteItem = async (id) => {
    if (!window.confirm('¿Eliminar este plato?')) return
    await supabase.from('menu_items').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    clearMenuCache(profile.restaurant_id)
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <div>
          {restaurantName && <p className="text-[11px] text-primary-500 font-semibold">{restaurantName}</p>}
          <h1 className="text-xl font-bold text-dark leading-tight">Mi menú</h1>
        </div>
        <button onClick={() => setModal('new')} className="bg-primary-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1">
          <Plus size={14} /> Agregar plato
        </button>
      </div>

      <RestaurantProfile
        restaurantId={profile.restaurant_id}
        onUpdated={() => clearMenuCache(profile.restaurant_id)}
      />

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Sin platos. Agrega el primero con el botón de arriba.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className={`bg-white rounded-2xl shadow-sm p-3 flex gap-3 ${!item.is_available ? 'opacity-60' : ''}`}>
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">🍴</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark text-sm">{item.name}</p>
                  {item.category && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{item.category}</span>}
                  <p className="text-primary-500 font-bold text-sm mt-0.5">{APP_CONFIG.currency} {Number(item.price).toFixed(2)}</p>
                </div>
                <div className="flex flex-col gap-1.5 items-center justify-center">
                  <button onClick={() => toggleAvailable(item)}>
                    {item.is_available ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} className="text-gray-300" />}
                  </button>
                  <button onClick={() => setModal(item)}><Pencil size={16} className="text-gray-400 hover:text-primary-500" /></button>
                  <button onClick={() => deleteItem(item.id)}><Trash2 size={16} className="text-gray-300 hover:text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <ItemModal
          item={modal === 'new' ? null : modal}
          restaurantId={profile.restaurant_id}
          onSave={() => { setModal(null); fetch(); clearMenuCache(profile.restaurant_id) }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
