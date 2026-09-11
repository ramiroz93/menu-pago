import { useState, useEffect } from 'react'
import { CheckCircle, LogOut, User, Phone, Mail, Wallet, MapPin, Plus, Trash2, Link, Globe, Link2 } from 'lucide-react'
import { supabase } from '../../config/supabase'
import useStore from '../../store/useStore'
import Spinner from '../../components/Spinner'
import MapPicker from '../../components/MapPicker'
import InstallButton from '../../components/InstallButton'
import { APP_CONFIG } from '../../config/app.config'

export default function Profile() {
  const { profile, setProfile, logout } = useStore()
  const [name, setName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [city, setCity] = useState(profile?.city || '')
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [locations, setLocations] = useState([])
  const [locName, setLocName] = useState('')
  const [locUrl, setLocUrl] = useState('')
  const [savingLoc, setSavingLoc] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showMapPicker, setShowMapPicker] = useState(false)

  useEffect(() => {
    supabase.from('cities').select('name').eq('is_active', true).order('name')
      .then(({ data }) => setCities(data?.map((c) => c.name) || []))
  }, [])

  const loadLocations = (userCity) => {
    if (!profile?.id) return
    let q = supabase.from('user_locations').select('*').eq('user_id', profile.id)
    if (userCity) q = q.eq('city', userCity)
    q.order('created_at').then(({ data }) => setLocations(data || []))
  }

  useEffect(() => {
    loadLocations(profile?.city)
  }, [profile?.id])

  const addLocation = async () => {
    if (!locName.trim()) return
    setSavingLoc(true)
    const { data } = await supabase.from('user_locations')
      .insert({ user_id: profile.id, name: locName.trim(), maps_url: locUrl.trim() || null, city: city || profile?.city || null })
      .select().single()
    if (data) setLocations((prev) => [...prev, data])
    setLocName(''); setLocUrl('')
    setSavingLoc(false)
  }

  const deleteLocation = async (id) => {
    setDeletingId(id)
    await supabase.from('user_locations').delete().eq('id', id)
    setLocations((prev) => prev.filter((l) => l.id !== id))
    setDeletingId(null)
  }

  const initials = (profile?.full_name || 'U')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre no puede estar vacío'); return }
    if (!city) { setError('Debes seleccionar una ciudad'); return }
    setError('')
    setLoading(true)

    const cityChanged = city !== profile?.city

    const { error: err } = await supabase.rpc('update_own_profile', {
      p_full_name: name.trim(),
      p_phone: phone.trim(),
      p_city: city,
    })

    if (err) {
      setError('No se pudo guardar. Intenta de nuevo.')
    } else {
      setProfile({ ...profile, full_name: name.trim(), phone: phone.trim(), city })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      if (cityChanged) loadLocations(city)
    }
    setLoading(false)
  }

  const changed = name.trim() !== (profile?.full_name || '')
    || phone.trim() !== (profile?.phone || '')
    || city !== (profile?.city || '')

  const cityChanging = city !== (profile?.city || '') && city !== ''

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-4 pt-14 pb-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-3">
          <span className="text-white text-2xl font-bold">{initials}</span>
        </div>
        <h1 className="text-white text-lg font-bold">{profile?.full_name}</h1>
        <p className="text-primary-100 text-xs mt-0.5">{profile?.email}</p>
        {profile?.city && (
          <div className="flex items-center gap-1 mt-1.5 bg-white/20 rounded-full px-3 py-1">
            <MapPin size={11} className="text-white/80" />
            <span className="text-white text-xs font-medium">{profile.city}</span>
          </div>
        )}
        <div className="mt-3 bg-white/20 rounded-xl px-4 py-2 text-center">
          <p className="text-primary-100 text-[10px]">Saldo disponible</p>
          <p className="text-white font-bold text-base">{APP_CONFIG.currency} {Number(profile?.wallet_balance || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 -mt-4">

        {/* Card editable */}
        <div className="bg-white rounded-3xl shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-dark">Datos personales</h2>

          <div>
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
              <User size={13} /> Nombre completo
            </label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Tu nombre" />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
              <Phone size={13} /> Teléfono
            </label>
            <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Ej: 70000000" />
            <p className="text-[10px] text-gray-400 mt-1">Lo usamos para confirmar recargas por WhatsApp</p>
          </div>

          {/* Ciudad */}
          <div>
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
              <Globe size={13} /> Ciudad
            </label>
            <select value={city} onChange={(e) => { setCity(e.target.value); setSaved(false) }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors appearance-none bg-white">
              <option value="">Selecciona tu ciudad</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {cityChanging && (
              <p className="text-[11px] text-amber-600 mt-1.5 bg-amber-50 px-3 py-1.5 rounded-lg">
                ⚠️ Al cambiar de ciudad se mostrarán tus ubicaciones de {city}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-1.5">
              <Mail size={13} /> Correo electrónico
            </label>
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-400">
              {profile?.email}
            </div>
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button onClick={handleSave} disabled={loading || !changed || saved}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${saved ? 'bg-green-500 text-white' : changed ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {loading ? <Spinner size="sm" /> : saved ? <><CheckCircle size={16} /> Guardado</> : 'Guardar cambios'}
          </button>
        </div>

        {/* Ubicaciones filtradas por ciudad */}
        <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-dark flex items-center gap-2">
            <MapPin size={15} className="text-primary-500" /> Mis ubicaciones
            {profile?.city && <span className="text-xs text-gray-400 font-normal">· {profile.city}</span>}
          </h2>

          {locations.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">
              {profile?.city ? `Sin ubicaciones en ${profile.city}` : 'Aún no tienes ubicaciones guardadas'}
            </p>
          )}

          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
              <MapPin size={14} className="text-primary-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark">{loc.name}</p>
                {loc.maps_url && (
                  <a href={loc.maps_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-primary-500 underline truncate block">Ver en Google Maps</a>
                )}
              </div>
              <button onClick={() => deleteLocation(loc.id)} disabled={deletingId === loc.id}
                className="p-1.5 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40">
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-xs font-medium text-gray-500">Agregar ubicación</p>
            <input value={locName} onChange={(e) => setLocName(e.target.value)}
              placeholder="Nombre (ej: Casa, Oficina, Universidad...)"
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors" />
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={locUrl}
                    onChange={(e) => setLocUrl(e.target.value)}
                    placeholder="Pega tu link de Google Maps"
                    className="w-full pl-8 pr-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  disabled={!profile?.city && !city}
                  className="flex items-center gap-1 px-3 py-2.5 bg-primary-50 border border-primary-200 text-primary-600 rounded-xl text-xs font-semibold whitespace-nowrap hover:bg-primary-100 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <MapPin size={13} />
                  En el mapa
                </button>
              </div>
              {locUrl && (
                <a href={locUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary-500 hover:underline">
                  <MapPin size={11} /> Ver ubicación seleccionada
                </a>
              )}
            </div>
            {showMapPicker && (
              <MapPicker
                city={city || profile?.city}
                onConfirm={(url) => { setLocUrl(url); setShowMapPicker(false) }}
                onClose={() => setShowMapPicker(false)}
              />
            )}
            <button onClick={addLocation} disabled={!locName.trim() || !locUrl.trim() || savingLoc || !profile?.city}
              className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {savingLoc ? <Spinner size="sm" /> : <><Plus size={15} /> Guardar ubicación</>}
            </button>
            {!profile?.city && (
              <p className="text-[11px] text-amber-600 text-center">Primero selecciona tu ciudad para agregar ubicaciones</p>
            )}
          </div>
        </div>

        <InstallButton />

        {/* Saldo */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-primary-500" />
              <span className="text-sm font-semibold text-dark">Mi saldo</span>
            </div>
            <span className="font-bold text-primary-500">{APP_CONFIG.currency} {Number(profile?.wallet_balance || 0).toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 pl-6">Para recargar ve a la pestaña Saldo</p>
        </div>

        <button onClick={logout}
          className="w-full py-3 rounded-xl text-sm font-semibold text-red-500 border-2 border-red-100 hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
