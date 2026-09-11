import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Search, Loader } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

const CITY_COORDS = {
  'Tarija':       [-21.5355, -64.7296],
  'Sucre':        [-19.0196, -65.2619],
  'La Paz':       [-16.5000, -68.1500],
  'Cochabamba':   [-17.3895, -66.1568],
  'Santa Cruz':   [-17.7833, -63.1833],
  'Oruro':        [-17.9833, -67.1500],
  'Potosí':       [-19.5836, -65.7531],
  'Trinidad':     [-14.8333, -64.9000],
  'Cobija':       [-11.0297, -68.7742],
  'Riberalta':    [-11.0000, -66.0667],
  'Yacuiba':      [-22.0167, -63.6833],
  'Camiri':       [-20.0500, -63.5167],
}

const DEFAULT_COORDS = [-19.0196, -65.2619] // Sucre como fallback

export default function MapPicker({ city, onConfirm, onClose }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [coords, setCoords] = useState(null)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const centerCoords = (city && CITY_COORDS[city]) || DEFAULT_COORDS

  useEffect(() => {
    let map

    import('leaflet').then((mod) => {
      const L = mod.default

      if (mapRef.current) return // ya inicializado
      map = L.map(mapContainerRef.current, { zoomControl: true }).setView(centerCoords, 15)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      const redIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:22px; height:22px;
          background:#ef4444;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
        popupAnchor: [0, -22],
      })

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        setCoords([lat, lng])
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng)
        } else {
          markerRef.current = L.marker(e.latlng, { icon: redIcon }).addTo(map)
        }
      })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  const placeMarker = (lat, lng) => {
    if (!mapRef.current) return
    import('leaflet').then((mod) => {
      const L = mod.default
      const redIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:22px; height:22px;
          background:#ef4444;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      })
      setCoords([lat, lng])
      mapRef.current.setView([lat, lng], 17)
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { icon: redIcon }).addTo(mapRef.current)
      }
    })
  }

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const query = `${search.trim()}, ${city || 'Bolivia'}`
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      if (data.length > 0) {
        placeMarker(parseFloat(data[0].lat), parseFloat(data[0].lon))
      } else {
        setSearchError('No se encontró esa dirección. Intenta ser más específico.')
      }
    } catch {
      setSearchError('Error al buscar. Verifica tu conexión.')
    }
    setSearching(false)
  }

  const handleConfirm = () => {
    if (!coords) return
    const [lat, lng] = coords
    onConfirm(`https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`)
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-primary-500" />
          <div>
            <p className="font-bold text-dark text-sm">Seleccionar ubicación</p>
            {city && <p className="text-[11px] text-gray-400">{city}, Bolivia</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex gap-2 px-3 py-2.5 bg-gray-50 border-b flex-shrink-0">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={`Buscar dirección en ${city || 'Bolivia'}...`}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !search.trim()}
          className="bg-primary-500 text-white px-3 rounded-xl disabled:opacity-40 flex items-center justify-center"
        >
          {searching ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </div>
      {searchError && (
        <p className="text-xs text-red-500 px-4 py-1.5 bg-red-50 border-b flex-shrink-0">{searchError}</p>
      )}

      {/* Instrucción */}
      <div className="px-4 py-2 bg-blue-50 border-b flex-shrink-0">
        <p className="text-[11px] text-blue-600 text-center">
          Toca el mapa para colocar el pin rojo en la ubicación exacta donde recibirás tu pedido
        </p>
      </div>

      {/* Mapa */}
      <div ref={mapContainerRef} className="flex-1" style={{ minHeight: 0 }} />

      {/* Footer */}
      <div className="px-4 py-3 bg-white border-t flex-shrink-0">
        {coords ? (
          <p className="text-[11px] text-gray-400 text-center mb-2">
            📍 {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
          </p>
        ) : (
          <p className="text-[11px] text-gray-400 text-center mb-2">
            Aún no has seleccionado una ubicación
          </p>
        )}
        <button
          onClick={handleConfirm}
          disabled={!coords}
          className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <MapPin size={16} />
          Aquí recibiré mi pedido
        </button>
      </div>
    </div>
  )
}
