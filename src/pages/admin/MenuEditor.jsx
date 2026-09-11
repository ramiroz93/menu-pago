import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Camera, X, GripVertical } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { APP_CONFIG } from '../../config/app.config'
import { uploadMenuImage, deleteMenuImage } from '../../utils/imageUtils'

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

export default function AdminMenuEditor() {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const { clearMenuCache } = useStore()
  const [restaurant, setRestaurant] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const fetch = async () => {
    const [{ data: rest }, { data: menu }] = await Promise.all([
      supabase.from('restaurants').select('name').eq('id', restaurantId).single(),
      supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).order('sort_order', { ascending: true, nullsFirst: false }),
    ])
    setRestaurant(rest)
    setItems(menu || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [restaurantId])

  const toggleAvailable = async (item) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
    clearMenuCache(restaurantId)
  }

  const deleteItem = async (id) => {
    if (!window.confirm('¿Eliminar este plato?')) return
    await supabase.from('menu_items').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    clearMenuCache(restaurantId)
  }

  const handleDragStart = (index) => {
    dragItem.current = index
  }

  const handleDragEnter = (index) => {
    dragOverItem.current = index
  }

  const handleDrop = async () => {
    const from = dragItem.current
    const to = dragOverItem.current
    if (from === null || to === null || from === to) {
      dragItem.current = null
      dragOverItem.current = null
      return
    }

    const newItems = [...items]
    const dragged = newItems.splice(from, 1)[0]
    newItems.splice(to, 0, dragged)
    setItems(newItems)
    dragItem.current = null
    dragOverItem.current = null

    setSaving(true)
    await Promise.all(
      newItems.map((item, index) =>
        supabase.from('menu_items').update({ sort_order: index + 1 }).eq('id', item.id)
      )
    )
    clearMenuCache(restaurantId)
    setSaving(false)
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin/restaurantes')} className="text-gray-400 hover:text-dark">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs text-gray-400">Menú de</p>
            <h1 className="text-base font-bold text-dark">{restaurant?.name || '...'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[10px] text-gray-400">Guardando orden...</span>}
          <button onClick={() => setModal('new')} className="bg-primary-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1">
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Sin platos. Agrega el primero.</div>
        ) : (
          <>
            <p className="text-[11px] text-gray-400 text-center mb-3 flex items-center justify-center gap-1">
              <GripVertical size={12} /> Arrastra para reordenar
            </p>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`bg-white rounded-2xl shadow-sm p-3 flex gap-3 transition-opacity ${!item.is_available ? 'opacity-60' : ''} ${dragItem.current === index ? 'opacity-40 scale-95' : ''} cursor-grab active:cursor-grabbing`}
                >
                  <div className="flex items-center text-gray-300 flex-shrink-0 touch-none">
                    <GripVertical size={18} />
                  </div>
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
          </>
        )}
      </div>

      {modal && (
        <ItemModal
          item={modal === 'new' ? null : modal}
          restaurantId={restaurantId}
          onSave={() => { setModal(null); fetch(); clearMenuCache(restaurantId) }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
