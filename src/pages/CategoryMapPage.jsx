import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import Navbar from '../components/Navbar'
import api from '../api/client'
import 'leaflet/dist/leaflet.css'
import '../styles/MapPage.css'

import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// ─── Viewport Listener ────────────────────────────────────────
function ViewportListener({ onBoundsChange }) {
  const map = useMap()

  const notify = useCallback(() => {
    const b = map.getBounds()
    onBoundsChange({
      minLat: b.getSouth(),
      maxLat: b.getNorth(),
      minLng: b.getWest(),
      maxLng: b.getEast(),
    })
  }, [map, onBoundsChange])

  // Harita hazır olunca ilk bbox'ı al
  useEffect(() => {
    map.whenReady(notify)
  }, [map, notify])

  useMapEvents({
    moveend: notify,
    zoomend: notify,
  })

  return null
}

// ─── Ana Bileşen ──────────────────────────────────────────────
function CategoryMapPage() {
  const { slug } = useParams()
  const [venues, setVenues] = useState([])
  const [category, setCategory] = useState(null)
  const [fieldDefs, setFieldDefs] = useState([])
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [venueCount, setVenueCount] = useState(null)

  // İstek yönetimi ve Cache
  const latestReqId = useRef(0)
  const cache = useRef({})
  const lastBoundsRef = useRef(null)
  const filtersRef = useRef(filters)
  const debounceTimer = useRef(null)
  const isFirstLoad = useRef(true)

  // filtersRef'i güncel tut
  useEffect(() => { filtersRef.current = filters }, [filters])

  // Kategori meta verisi — bir kez çek
  useEffect(() => {
    api.get(`/categories/${slug}/`).then(res => {
      setCategory(res.data)
      setFieldDefs(res.data.field_definitions || [])
    })
    api.get(`/venues/?category=${slug}&count_only=1`)
      .then(res => setVenueCount(res.data?.count ?? null))
      .catch(() => {})
  }, [slug])

  // Sadece görünen alandaki verileri çek (isFilterChange parametresi eklendi)
  const fetchViewport = useCallback(async (bounds, activeFilters, isFilterChange = false) => {
    if (!bounds) return

    // Cache oranını artırmak için koordinatları yuvarlıyoruz (~110m hassasiyet)
    const roundCoord = (val) => Number(parseFloat(val).toFixed(3))
    const minLng = roundCoord(bounds.minLng)
    const minLat = roundCoord(bounds.minLat)
    const maxLng = roundCoord(bounds.maxLng)
    const maxLat = roundCoord(bounds.maxLat)

    const params = new URLSearchParams({
      category: slug,
      bbox: `${minLng},${minLat},${maxLng},${maxLat}`,
    })

    Object.entries(activeFilters).forEach(([k, v]) => {
      if (v !== '' && v !== null) params.append(`field__${k}`, v)
    })

    const cacheKey = params.toString()
    let dataToProcess = null

    // Cache kontrolü
    if (cache.current[cacheKey]) {
      dataToProcess = cache.current[cacheKey]
    }

    // Cache'de yoksa API'den çek
    if (!dataToProcess) {
      const reqId = ++latestReqId.current
      setLoading(true)

      try {
        const res = await api.get(`/venues/?${cacheKey}`)
        if (reqId !== latestReqId.current) return 
        
        dataToProcess = Array.isArray(res.data) ? res.data : (res.data.results || [])
        cache.current[cacheKey] = dataToProcess
      } catch (err) {
        if (reqId === latestReqId.current) console.error('Venue fetch hatası:', err)
        return
      } finally {
        if (reqId === latestReqId.current) setLoading(false)
      }
    }

    // Veriyi State'e yazarken Tekilleştirme (Deduplication) yapıyoruz
    if (dataToProcess) {
      setVenues(prev => {
        // Eğer filtre değiştiyse eski haritayı sil, sadece yeni filtrelenmiş veriyi göster
        if (isFilterChange) return dataToProcess

        // Sadece kaydırma yapıldıysa, mevcut pinleri silme; sadece YENİ olanları ekle
        const existingIds = new Set(prev.map(v => v.id))
        const newItems = dataToProcess.filter(v => !existingIds.has(v.id))

        // Eklenecek yeni pin yoksa state referansını hiç bozma (Titremeyi engelleyen ana nokta)
        if (newItems.length === 0) return prev

        return [...prev, ...newItems]
      })
    }
  }, [slug])

  // Harita hareket edince: ilk yüklemede anında, sonrasında 500ms debounce
  const handleBoundsChange = useCallback((bounds) => {
    lastBoundsRef.current = bounds

    if (isFirstLoad.current) {
      isFirstLoad.current = false
      fetchViewport(bounds, filtersRef.current, false)
      return
    }

    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchViewport(bounds, filtersRef.current, false)
    }, 500)
  }, [fetchViewport])

  // Filtre değişince cache'i temizle, isFilterChange = true olarak yeniden çek
  useEffect(() => {
    cache.current = {}
    if (lastBoundsRef.current) {
      fetchViewport(lastBoundsRef.current, filters, true)
    }
  }, [filters, fetchViewport])

  const handleFilter = (name, value) => setFilters(p => ({ ...p, [name]: value }))
  const clearFilters = () => setFilters({})
  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== null).length

  // MARKER'LARI MEMOIZE EDİYORUZ (Gereksiz render'ları ve titremeyi önler)
  const markerElements = useMemo(() => {
    return venues
      .filter(v => v.latitude && v.longitude)
      .map(venue => (
        <Marker
          key={venue.id}
          position={[parseFloat(venue.latitude), parseFloat(venue.longitude)]}
        >
          <Popup>
            <strong>{venue.name}</strong><br />
            {venue.city}<br />
            <Link to={`/venue/${slug}/${venue.slug}`}>View details →</Link>
          </Popup>
        </Marker>
      ))
  }, [venues, slug])

  return (
    <div className="map-page">
      <Navbar />

      <div className="map-layout">
        <div className="map-container">
          <MapContainer
            center={[39.9, 32.8]}
            zoom={12}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <ZoomControl position="topright" />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            />

            <ViewportListener onBoundsChange={handleBoundsChange} />

            <MarkerClusterGroup>
              {markerElements}
            </MarkerClusterGroup>
          </MapContainer>

          {/* Filtre butonu */}
          <button
            className={`filter-fab${activeFilterCount > 0 ? ' filter-fab-active' : ''}`}
            onClick={() => setFilterOpen(true)}
          >
            ⚙ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>

          {/* Durum çubuğu */}
          <div className="map-status-bar">
            {loading
              ? <span className="map-status-loading">⟳ Yükleniyor…</span>
              : (
                <span className="map-status-count">
                  {venues.length} venue görünüyor
                  {venueCount !== null && ` · ${venueCount} toplam`}
                </span>
              )
            }
          </div>
        </div>
      </div>

      {/* Filtre Drawer */}
      {filterOpen && (
        <div className="filter-overlay" onClick={() => setFilterOpen(false)}>
          <div className="filter-drawer" onClick={e => e.stopPropagation()}>
            <div className="filter-drawer-header">
              <h3>Filter {category?.name}</h3>
              <button onClick={() => setFilterOpen(false)} className="filter-close">✕</button>
            </div>
            <div className="filter-drawer-body">
              {fieldDefs.filter(f => f.is_public).map(field => (
                <div key={field.id} className="filter-item">
                  <label className="filter-label">{field.label}</label>
                  {field.help_text && <p className="filter-help">{field.help_text}</p>}
                  {field.field_type === 'boolean' ? (
                    <select
                      className="filter-select"
                      value={filters[field.label] || ''}
                      onChange={e => handleFilter(field.label, e.target.value)}
                    >
                      <option value="">Any</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="filter-input"
                      placeholder={field.help_text || `Search ${field.label}…`}
                      value={filters[field.label] || ''}
                      onChange={e => handleFilter(field.label, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="filter-drawer-footer">
              <button onClick={clearFilters} className="btn-clear">Clear All</button>
              <button onClick={() => setFilterOpen(false)} className="btn-apply">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryMapPage