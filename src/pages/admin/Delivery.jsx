import { useState, useEffect } from 'react'
import { Truck, Plus, Pencil, Trash2, MessageCircle, X, Check } from 'lucide-react'
import { supabase } from '../../config/supabase'
import Spinner from '../../components/Spinner'

function DeliveryModal({ company, onSave, onClose }) {
  const [name, setName] = useState(company?.name || '')
  const [whatsapp, setWhatsapp] = useState(company?.whatsapp || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (company?.id) {
      await supabase.from('delivery_companies').update({ name: name.trim(), whatsapp: whatsapp.trim() }).eq('id', company.id)
    } else {
      await supabase.from('delivery_companies').insert({ name: name.trim(), whatsapp: whatsapp.trim() })
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-dark text-sm">{company?.id ? 'Editar empresa' : 'Nueva empresa de delivery'}</h3>
          <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la empresa"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="WhatsApp (ej: 59170000000)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full mt-4 bg-primary-500 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {saving ? <Spinner size="sm" /> : <><Check size={15} /> {company?.id ? 'Guardar cambios' : 'Agregar empresa'}</>}
        </button>
      </div>
    </div>
  )
}

export default function AdminDelivery() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetch = async () => {
    const { data } = await supabase
      .from('delivery_companies')
      .select('*')
      .order('name')
    setCompanies(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleDelete = async (id) => {
    setDeleting(id)
    await supabase.from('delivery_companies').delete().eq('id', id)
    await fetch()
    setDeleting(null)
  }

  const waLink = (phone) => {
    const clean = (phone || '').replace(/\D/g, '')
    if (!clean) return null
    return `https://wa.me/${clean}`
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-dark">Delivery</h1>
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-1.5 bg-primary-500 text-white text-xs font-bold px-3 py-2 rounded-xl"
          >
            <Plus size={14} /> Nueva empresa
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Empresas de delivery asociadas</p>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16">
            <Truck size={40} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Sin empresas registradas</p>
            <p className="text-gray-300 text-xs mt-1">Toca "Nueva empresa" para agregar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Truck size={18} className="text-primary-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.whatsapp || 'Sin WhatsApp'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {waLink(c.whatsapp) && (
                    <a href={waLink(c.whatsapp)} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                      <MessageCircle size={14} className="text-green-600" />
                    </a>
                  )}
                  <button onClick={() => setModal(c)}
                    className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Pencil size={14} className="text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                    className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center disabled:opacity-40">
                    {deleting === c.id ? <Spinner size="sm" /> : <Trash2 size={14} className="text-red-400" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal !== null && (
        <DeliveryModal
          company={modal?.id ? modal : null}
          onSave={() => { setModal(null); fetch() }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
