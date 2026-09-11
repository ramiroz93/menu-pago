import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, ToggleLeft, ToggleRight, UtensilsCrossed, Camera, X, Check, Copy, CheckCheck, Trash2, Clock, MapPin, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../config/supabase'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import MapPicker from '../../components/MapPicker'
import { uploadMenuImage, deleteMenuImage } from '../../utils/imageUtils'
import { isRestaurantOpen } from '../../utils/scheduleUtils'
import { APP_CONFIG } from '../../config/app.config'

const DIAS = [
  { key: 'lun', label: 'Lun' },
  { key: 'mar', label: 'Mar' },
  { key: 'mie', label: 'Mié' },
  { key: 'jue', label: 'Jue' },
  { key: 'vie', label: 'Vie' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
]

const POSITIONS = [1, 2, 3, 4, 5]

function ImageUploader({ label, value, field, onUpload, onRemove, uploading, aspect = 'cover' }) {
  const fileRef = useRef()
  const isLogo = aspect === 'logo'
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e, field)} />
      {value ? (
        <div className={`relative ${isLogo ? 'w-24 h-24' : 'w-full h-28'}`}>
          <img src={value} alt={label} className="w-full h-full object-cover rounded-xl" />
          <button onClick={() => onRemove(field, value)}
            className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1">
            <X size={12} />
          </button>
          <button onClick={() => fileRef.current.click()}
            className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
            <Camera size={10} /> Cambiar
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current.click()} disabled={uploading === field}
          className={`border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary-300 hover:text-primary-400 transition-colors disabled:opacity-60
            ${isLogo ? 'w-24 h-24' : 'w-full h-20'}`}>
          {uploading === field ? <Spinner size="sm" /> : <><Camera size={18} /><span className="text-[10px] text-center px-1">{isLogo ? 'Logo' : 'Portada'}</span></>}
        </button>
      )}
    </div>
  )
}

function RestaurantModal({ restaurant, allCategories, cities, onSave, onClose, onCategoryCreated }) {
  const [form, setForm] = useState(restaurant || {
    name: '', description: '', categories: [], address: '',
    cover_image: '', logo: '', is_active: true, sort_order: null,
    consumption_balance: 0, city: '', schedule: null, whatsapp: '', maps: '', same_price: false, accepts_pickup: false,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(null)
  const [credentials, setCredentials] = useState(null)
  const [copied, setCopied] = useState(null)
  const [newCat, setNewCat] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [addNote, setAddNote] = useState('')
  const [addingBalance, setAddingBalance] = useState(false)
  const [balanceLogs, setBalanceLogs] = useState([])
  const [showMapPicker, setShowMapPicker] = useState(false)

  useEffect(() => {
    if (!restaurant?.id) return
    supabase.from('consumption_balance_logs')
      .select('amount, note, created_at')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setBalanceLogs(data || []))
  }, [restaurant?.id])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleAddBalance = async () => {
    const amount = parseFloat(addAmount)
    if (!amount || !restaurant?.id) return
    setAddingBalance(true)
    await supabase.rpc('admin_add_consumption_balance', {
      p_restaurant_id: restaurant.id,
      p_amount: amount,
      p_note: addNote.trim() || null,
    })
    setForm((f) => ({ ...f, consumption_balance: (Number(f.consumption_balance) || 0) + amount }))
    setBalanceLogs((prev) => [{ amount, note: addNote.trim() || null, created_at: new Date().toISOString() }, ...prev])
    setAddAmount('')
    setAddNote('')
    setAddingBalance(false)
  }

  const toggleCategory = (cat) => {
    setForm((f) => {
      const current = f.categories || []
      const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat]
      return { ...f, categories: next }
    })
  }

  const createCategory = async () => {
    const name = newCat.trim()
    if (!name) return
    setAddingCat(true)
    await supabase.from('categories').insert({ name })
    setNewCat('')
    setAddingCat(false)
    onCategoryCreated()
    toggleCategory(name)
  }

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(field)
    try {
      const url = await uploadMenuImage(file, supabase, form[field])
      setForm((f) => ({ ...f, [field]: url }))
    } catch {
      alert('No se pudo subir la imagen. Intenta de nuevo.')
    }
    setUploading(null)
  }

  const handleRemove = (field, url) => {
    deleteMenuImage(url, supabase)
    setForm((f) => ({ ...f, [field]: '' }))
  }

  const copyField = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const { consumption_balance, ...rest } = form
    const payload = { ...rest, sort_order: form.sort_order || null }

    // Si se asigna posición, liberarla de cualquier otro restaurante que la tenga
    if (payload.sort_order) {
      let q = supabase.from('restaurants').update({ sort_order: null }).eq('sort_order', payload.sort_order)
      if (restaurant?.id) q = q.neq('id', restaurant.id)
      await q
    }

    if (restaurant?.id) {
      await supabase.from('restaurants').update(payload).eq('id', restaurant.id)
      onSave()
    } else {
      const { data: newRest, error: insertErr } = await supabase
        .from('restaurants').insert(payload).select().single()

      if (insertErr || !newRest) { setSaving(false); return }

      const slug = form.name
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '')
      const email = `${slug}@menupago.com`
      const password = `Menu${Math.floor(1000 + Math.random() * 9000)}`

      const { error: accessErr } = await supabase.rpc('admin_create_restaurant_access', {
        p_restaurant_id: newRest.id,
        p_email: email,
        p_password: password,
      })

      setCredentials({ email, password, error: accessErr?.message || null })
    }
    setSaving(false)
  }

  if (credentials) {
    const whatsappText = `Hola! Aquí están tus accesos para Menu-Pago:\n\n📧 Correo: ${credentials.email}\n🔑 Contraseña: ${credentials.password}\n\nIngresa en: menu-pago.vercel.app`
    return (
      <Modal title="✅ Restaurante creado" onClose={() => { setCredentials(null); onSave() }}>
        <p className="text-sm text-gray-600">
          Se creó el acceso para <strong>{form.name}</strong>. Comparte estas credenciales con el local:
        </p>

        <div className="space-y-3 bg-gray-50 rounded-2xl p-4">
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Correo</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-dark">
                {credentials.email}
              </code>
              <button onClick={() => copyField(credentials.email, 'email')}
                className="p-2.5 bg-white border border-gray-200 rounded-xl text-primary-500 hover:bg-primary-50 transition-colors">
                {copied === 'email' ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Contraseña</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-dark">
                {credentials.password}
              </code>
              <button onClick={() => copyField(credentials.password, 'pass')}
                className="p-2.5 bg-white border border-gray-200 rounded-xl text-primary-500 hover:bg-primary-50 transition-colors">
                {copied === 'pass' ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {credentials.error && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
            ⚠️ El restaurante se creó pero hubo un error al generar el acceso: {credentials.error}
          </p>
        )}

        <button onClick={() => copyField(whatsappText, 'all')}
          className="w-full py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
          {copied === 'all' ? <><CheckCheck size={16} /> ¡Copiado!</> : <><Copy size={16} /> Copiar para WhatsApp</>}
        </button>

        <button onClick={() => { setCredentials(null); onSave() }}
          className="w-full py-3 bg-primary-500 text-white font-bold rounded-xl text-sm">
          Listo
        </button>
      </Modal>
    )
  }

  return (
    <Modal title={restaurant?.id ? 'Editar restaurante' : 'Nuevo restaurante'} onClose={onClose}>
      <input type="text" value={form.name || ''} onChange={set('name')} placeholder="Nombre del local"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <input type="text" value={form.address || ''} onChange={set('address')} placeholder="Dirección"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <input type="tel" value={form.whatsapp || ''} onChange={set('whatsapp')} placeholder="WhatsApp del restaurante (ej: 59170000000)"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      {/* Campo de Maps con 2 opciones */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500">Ubicación en Google Maps</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={form.maps || ''}
              onChange={set('maps')}
              placeholder="Pega tu link de Google Maps"
              className="w-full pl-8 pr-3 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowMapPicker(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-primary-50 border border-primary-200 text-primary-600 rounded-xl text-xs font-semibold whitespace-nowrap hover:bg-primary-100 transition-colors flex-shrink-0"
          >
            <MapPin size={13} />
            Seleccionar en mapa
          </button>
        </div>
        {form.maps && (
          <a href={form.maps} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary-500 hover:underline">
            <MapPin size={11} /> Ver ubicación guardada
          </a>
        )}
      </div>
      {showMapPicker && (
        <MapPicker
          city={form.city}
          onConfirm={(url) => { setForm((f) => ({ ...f, maps: url })); setShowMapPicker(false) }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer select-none">
        <input type="checkbox" checked={!!form.same_price} onChange={(e) => setForm((f) => ({ ...f, same_price: e.target.checked }))}
          className="w-4 h-4 accent-primary-500 cursor-pointer" />
        <div>
          <p className="text-sm font-semibold text-dark">Mismo precio que el local</p>
          <p className="text-xs text-gray-400">El precio en la app es igual al precio del restaurante</p>
        </div>
      </label>
      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer select-none">
        <input type="checkbox" checked={!!form.accepts_pickup} onChange={(e) => setForm((f) => ({ ...f, accepts_pickup: e.target.checked }))}
          className="w-4 h-4 accent-primary-500 cursor-pointer" />
        <div>
          <p className="text-sm font-semibold text-dark">Acepta pedidos para recoger</p>
          <p className="text-xs text-gray-400">Los clientes podrán elegir recoger en local sin delivery</p>
        </div>
      </label>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">Ciudad</p>
        <select value={form.city || ''} onChange={set('city')}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Seleccionar ciudad...</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Posición destacada */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Posición en inicio (opcional)</p>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => setForm((f) => ({ ...f, sort_order: null }))}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors
              ${!form.sort_order ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}>
            Sin pos.
          </button>
          {POSITIONS.map((pos) => (
            <button key={pos} type="button"
              onClick={() => setForm((f) => ({ ...f, sort_order: f.sort_order === pos ? null : pos }))}
              className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors
                ${form.sort_order === pos ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'}`}>
              {pos}°
            </button>
          ))}
        </div>
        {form.sort_order && (
          <p className="text-[10px] text-amber-600 mt-1.5">
            Aparecerá en la posición {form.sort_order} para todos los usuarios
          </p>
        )}
      </div>

      {/* Imágenes */}
      <div className="flex gap-4 items-start">
        <ImageUploader label="Logo (tarjeta)" value={form.logo} field="logo"
          onUpload={handleUpload} onRemove={handleRemove} uploading={uploading} aspect="logo" />
        <div className="flex-1">
          <ImageUploader label="Portada (página del local)" value={form.cover_image} field="cover_image"
            onUpload={handleUpload} onRemove={handleRemove} uploading={uploading} aspect="cover" />
        </div>
      </div>

      {/* Horario */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Clock size={12} /> Horario de atención</p>
          {!form.schedule && (
            <button type="button" onClick={() => setForm((f) => ({
              ...f, schedule: Object.fromEntries(DIAS.map(({ key }) => [key, [{ open: '10:00', close: '22:00' }]]))
            }))} className="text-[10px] text-primary-500 font-semibold">+ Configurar horario</button>
          )}
          {form.schedule && (
            <button type="button" onClick={() => setForm((f) => ({ ...f, schedule: null }))}
              className="text-[10px] text-red-500 font-semibold">Quitar horario</button>
          )}
        </div>
        {form.schedule && (() => {
          const norm = {}
          for (const [k, v] of Object.entries(form.schedule)) {
            if (!v) norm[k] = null
            else if (Array.isArray(v)) norm[k] = v
            else norm[k] = [v]
          }
          return (
            <div className="space-y-1.5 bg-gray-50 rounded-xl p-3">
              {DIAS.map(({ key, label }) => {
                const shifts = norm[key]
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setForm((f) => {
                        const cur = Array.isArray(f.schedule[key]) ? f.schedule[key] : f.schedule[key] ? [f.schedule[key]] : null
                        return { ...f, schedule: { ...f.schedule, [key]: cur ? null : [{ open: '10:00', close: '22:00' }] } }
                      })} className={`w-7 h-4 rounded-full transition-colors flex-shrink-0 relative ${shifts ? 'bg-primary-500' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${shifts ? 'left-3.5' : 'left-0.5'}`} />
                      </button>
                      <span className={`text-[11px] font-medium w-8 flex-shrink-0 ${shifts ? 'text-dark' : 'text-gray-400'}`}>{label}</span>
                      {!shifts && <span className="text-[11px] text-gray-400">Cerrado</span>}
                      {shifts && shifts.length < 2 && (
                        <button type="button" onClick={() => setForm((f) => ({
                          ...f, schedule: { ...f.schedule, [key]: [...(Array.isArray(f.schedule[key]) ? f.schedule[key] : [f.schedule[key]]), { open: '18:00', close: '22:00' }] }
                        }))} className="text-[9px] text-primary-500 font-semibold ml-auto">+ Turno</button>
                      )}
                    </div>
                    {shifts && shifts.map((shift, idx) => (
                      <div key={idx} className="flex items-center gap-1 ml-9 pl-8">
                        <input type="time" value={shift.open} onChange={(e) => setForm((f) => {
                          const arr = Array.isArray(f.schedule[key]) ? [...f.schedule[key]] : [f.schedule[key]]
                          arr[idx] = { ...arr[idx], open: e.target.value }
                          return { ...f, schedule: { ...f.schedule, [key]: arr } }
                        })} className="flex-1 border border-gray-200 rounded-lg px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-400" />
                        <span className="text-gray-400 text-[10px]">-</span>
                        <input type="time" value={shift.close} onChange={(e) => setForm((f) => {
                          const arr = Array.isArray(f.schedule[key]) ? [...f.schedule[key]] : [f.schedule[key]]
                          arr[idx] = { ...arr[idx], close: e.target.value }
                          return { ...f, schedule: { ...f.schedule, [key]: arr } }
                        })} className="flex-1 border border-gray-200 rounded-lg px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-400" />
                        {shifts.length > 1 && (
                          <button type="button" onClick={() => setForm((f) => ({
                            ...f, schedule: { ...f.schedule, [key]: (Array.isArray(f.schedule[key]) ? f.schedule[key] : [f.schedule[key]]).filter((_, i) => i !== idx) }
                          }))} className="text-red-400 text-[10px] font-bold px-0.5">×</button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      <textarea value={form.description || ''} onChange={set('description')} placeholder="Descripción breve"
        rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />

      {/* Categorías multi-select */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Categorías</p>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => {
            const selected = (form.categories || []).includes(cat)
            return (
              <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                  ${selected ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                {selected && <Check size={11} />}
                {cat}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 mt-2">
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createCategory()}
            placeholder="Nueva categoría..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button onClick={createCategory} disabled={!newCat.trim() || addingCat}
            className="bg-primary-500 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-40 flex items-center gap-1">
            {addingCat ? <Spinner size="sm" /> : <><Plus size={12} /> Crear</>}
          </button>
        </div>
      </div>

      {/* Saldo en consumo */}
      <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">Saldo en consumo</p>
          <p className={`text-base font-bold ${(form.consumption_balance || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            Bs {Number(form.consumption_balance || 0).toFixed(2)}
          </p>
        </div>
        {restaurant?.id && (
          <>
            <div className="flex gap-2">
              <input
                type="number" step="0.01" min="0"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBalance()}
                placeholder="Monto a cargar..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button onClick={handleAddBalance} disabled={!addAmount || addingBalance}
                className="bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-40 flex items-center gap-1">
                {addingBalance ? <Spinner size="sm" /> : <><Plus size={12} /> Cargar</>}
              </button>
            </div>
            <input
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
              placeholder="Nota (ej: Recarga enero 2026)..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </>
        )}
        <p className="text-[10px] text-gray-400">Se descuenta automáticamente con cada pedido completado</p>

        {balanceLogs.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Historial de recargas</p>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {balanceLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-green-600">+ Bs {Number(log.amount).toFixed(2)}</p>
                    {log.note && <p className="text-[10px] text-gray-400 truncate">{log.note}</p>}
                  </div>
                  <p className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                    {new Date(log.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
        Activo (visible para usuarios)
      </label>
      <button onClick={handleSave} disabled={saving || uploading}
        className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {saving ? <Spinner size="sm" /> : 'Guardar'}
      </button>
    </Modal>
  )
}

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [categories, setCategories] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetch = async () => {
    const { data } = await supabase.from('restaurants').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('name')
    setRestaurants(data || [])
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('name').order('name')
    setCategories(data?.map((c) => c.name) || [])
  }

  useEffect(() => {
    fetch()
    fetchCategories()
    supabase.from('cities').select('name').eq('is_active', true).order('name')
      .then(({ data }) => setCities(data?.map((c) => c.name) || []))
  }, [])

  const toggle = async (r) => {
    await supabase.from('restaurants').update({ is_active: !r.is_active }).eq('id', r.id)
    setRestaurants((prev) => prev.map((x) => x.id === r.id ? { ...x, is_active: !x.is_active } : x))
  }

  const deleteRestaurant = async (r) => {
    // Borrar auth user vinculado (cascada a identities + profiles)
    await supabase.rpc('admin_delete_restaurant_user', { p_restaurant_id: r.id })
    await supabase.from('restaurants').delete().eq('id', r.id)
    setRestaurants((prev) => prev.filter((x) => x.id !== r.id))
    setConfirmDelete(null)
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-dark">Restaurantes</h1>
        <button onClick={() => setModal('new')} className="bg-primary-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1">
          <Plus size={14} /> Agregar
        </button>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Sin restaurantes registrados</div>
        ) : (
          <div className="space-y-3">
            {restaurants.map((r) => (
              <div key={r.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${!r.is_active ? 'opacity-60' : ''}`}>
                <div className="h-20 bg-gray-100 relative">
                  {r.cover_image || r.logo
                    ? <img src={r.cover_image || r.logo} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 text-3xl">🍽️</div>
                  }
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    {r.sort_order && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white">
                        #{r.sort_order}
                      </span>
                    )}
                    {r.is_active && (() => {
                      const lowBalance = Number(r.consumption_balance ?? 0) < APP_CONFIG.minConsumptionBalance
                      const open = !lowBalance && isRestaurantOpen(r)
                      return (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${open ? 'bg-green-500 text-white' : 'bg-red-100 text-red-600'}`}>
                          {lowBalance ? 'Sin saldo' : open ? 'Abierto' : 'Cerrado'}
                        </span>
                      )
                    })()}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-dark text-sm">{r.name}</p>
                      <p className="text-xs text-gray-400">{(r.categories || []).join(', ')} · {r.address}</p>
                      {r.consumption_balance != null && (
                        <p className={`text-xs font-semibold mt-0.5 ${r.consumption_balance > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          Consumo: Bs {Number(r.consumption_balance).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Link to={`/admin/menu/${r.id}`} title="Editar menú">
                        <UtensilsCrossed size={17} className="text-gray-400 hover:text-primary-500" />
                      </Link>
                      <button onClick={() => setModal(r)} title="Editar">
                        <Pencil size={17} className="text-gray-400 hover:text-primary-500" />
                      </button>
                      <button onClick={() => toggle(r)} title={r.is_active ? 'Desactivar' : 'Activar'}>
                        {r.is_active ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} className="text-gray-300" />}
                      </button>
                      <button onClick={() => setConfirmDelete(r)} title="Eliminar">
                        <Trash2 size={17} className="text-gray-300 hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <RestaurantModal
          restaurant={modal === 'new' ? null : modal}
          allCategories={categories}
          cities={cities}
          onSave={() => { setModal(null); fetch() }}
          onClose={() => setModal(null)}
          onCategoryCreated={fetchCategories}
        />
      )}

      {confirmDelete && (
        <Modal title="Eliminar restaurante" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-gray-600">
            ¿Seguro que quieres eliminar <strong>{confirmDelete.name}</strong>?
          </p>
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
            Se eliminarán también todos sus platos y pedidos. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">
              Cancelar
            </button>
            <button onClick={() => deleteRestaurant(confirmDelete)}
              className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm">
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
