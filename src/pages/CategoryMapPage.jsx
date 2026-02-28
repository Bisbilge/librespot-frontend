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

  useEffect(() => {
    map.whenReady(notify)
  }, [map, notify])

  useMapEvents({
    moveend: notify,
    zoomend: notify,
  })

  return null
}

function CategoryMapPage() {
  const { slug } = useParams()
  const [venues, setVenues] = useState([])
  const [category, setCategory] = useState(null)
  const [fieldDefs, setFieldDefs] = useState([])
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [venueCount, setVenueCount] = useState(null)

  const latestReqId = useRef(0)
  const cache = useRef({})
  const lastBoundsRef = useRef(null)
  const filtersRef = useRef(filters)
  const debounceTimer = useRef(null)
  const isFirstLoad = useRef(true)

  useEffect(() => { filtersRef.current = filters }, [filters])

  useEffect(() => {
    api.get(`/categories/${slug}/`).then(res => {
      setCategory(res.data)
      setFieldDefs(res.data.field_definitions || [])
    })
    api.get(`/venues/?category=${slug}&count_only=1`)
      .then(res => setVenueCount(res.data?.count ?? null))
      .catch(() => {})
  }, [slug])

  const fetchViewport = useCallback(async (bounds, activeFilters, isFilterChange = false) => {
    if (!bounds) return

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

    if (cache.current[cacheKey]) {
      dataToProcess = cache.current[cacheKey]
    }

    if (!dataToProcess) {
      const reqId = ++latestReqId.current
      setLoading(true)
      try {
        const res = await api.get(`/venues/?${cacheKey}`)
        if (reqId !== latestReqId.current) return
        dataToProcess = Array.isArray(res.data) ? res.data : (res.data.results || [])
        cache.current[cacheKey] = dataToProcess
      } catch (err) {
        if (reqId === latestReqId.current) console.error('Venue fetch error:', err)
        return
      } finally {
        if (reqId === latestReqId.current) setLoading(false)
      }
    }

    if (dataToProcess) {
      setVenues(prev => {
        if (isFilterChange) return dataToProcess
        const existingIds = new Set(prev.map(v => v.id))
        const newItems = dataToProcess.filter(v => !existingIds.has(v.id))
        if (newItems.length === 0) return prev
        return [...prev, ...newItems]
      })
    }
  }, [slug])

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

  useEffect(() => {
    cache.current = {}
    if (lastBoundsRef.current) {
      fetchViewport(lastBoundsRef.current, filters, true)
    }
  }, [filters, fetchViewport])

  const handleFilter = (name, value) => setFilters(p => ({ ...p, [name]: value }))
  const clearFilters = () => setFilters({})
  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== null).length

  const markerElements = useMemo(() => {
    return venues
      .filter(v => v.latitude && v.longitude)
      .map(venue => (
        <Marker
          key={venue.id}
          position={[parseFloat(venue.latitude), parseFloat(venue.longitude)]}
        >
          <Popup>
            <div className="map-popup">
              <strong className="map-popup-name">{venue.name}</strong>
              {venue.city && <span className="map-popup-city">{venue.city}</span>}
              <Link to={`/venue/${slug}/${venue.slug}`} className="map-popup-link">
                View details →
              </Link>
            </div>
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

          {/* TOP BAR */}
          <div className="map-top-bar">
            <Link to={`/category/${slug}`} className="map-back-link">
              ← {category?.name || 'Back to category'}
            </Link>
            <div className="map-status">
              {loading
                ? <span className="map-status-loading">Loading…</span>
                : <span className="map-status-count">
                    {venues.length} visible
                    {venueCount !== null && ` of ${venueCount} total`}
                  </span>
              }
            </div>
          </div>

          {/* FILTER FAB */}
          <button
            className={`filter-fab${activeFilterCount > 0 ? ' filter-fab-active' : ''}`}
            onClick={() => setFilterOpen(true)}
          >
            ⚙ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
      </div>

      {/* FILTER DRAWER */}
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
              {fieldDefs.filter(f => f.is_public).length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
                  No filterable fields in this category.
                </p>
              )}
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