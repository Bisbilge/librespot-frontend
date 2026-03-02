// src/pages/CategoryMapPage.jsx

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

// Marker ikon
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const WORLD_BOUNDS = [[-90, -180], [90, 180]]

// Default konum: İstanbul Avrupa yakası
const DEFAULT_CENTER = [41.0082, 28.9784]
const DEFAULT_ZOOM = 13

// Viewport listener
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

// Kullanıcı konumunu al ve haritayı oraya taşı
function UserLocationHandler({ onLocationFound }) {
  const map = useMap()
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    // Geolocation API
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          map.setView([latitude, longitude], DEFAULT_ZOOM, { animate: true })
          onLocationFound?.({ latitude, longitude })
        },
        (error) => {
          console.log('Geolocation error:', error.message)
          // Hata durumunda default konumda kal
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // 5 dakika cache
        }
      )
    }
  }, [map, onLocationFound])

  return null
}

// Lazy-loaded popup content - sadece açılınca yüklenir
function VenuePopupContent({ venue, categorySlug }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Popup açıldığında yükle
  const loadDetail = useCallback(() => {
    if (loaded || loading) return
    
    setLoading(true)
    api.get(`/venues/${venue.slug}/`)
      .then(res => {
        setDetail(res.data)
        setLoaded(true)
      })
      .catch(err => {
        console.error('Popup load error:', err)
        setLoaded(true)
      })
      .finally(() => setLoading(false))
  }, [venue.slug, loaded, loading])

  // Component mount olduğunda yükle
  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  // İlgili kategorinin field değerlerini bul
  const categoryData = detail?.categories?.find(c => c.category_slug === categorySlug)
  const fieldValues = categoryData?.field_values?.filter(fv => fv.value && fv.value !== '') || []

  const formatValue = (fv) => {
    if (fv.display_value) return fv.display_value
    if (fv.field_type === 'boolean') {
      return fv.value === 'True' || fv.value === 'true' ? 'Yes' : 'No'
    }
    return fv.value
  }

  return (
    <div className="map-popup">
      <div className="map-popup-header">
        <strong className="map-popup-name">{venue.name}</strong>
        {detail?.city && (
          <span className="map-popup-location">
            📍 {detail.city}{detail.country ? `, ${detail.country}` : ''}
          </span>
        )}
      </div>

      <div className="map-popup-body">
        {loading && (
          <div className="map-popup-loading">Loading…</div>
        )}

        {!loading && loaded && fieldValues.length > 0 && (
          <table className="map-popup-fields">
            <tbody>
              {fieldValues.slice(0, 5).map(fv => (
                <tr key={fv.id}>
                  <td className="map-popup-field-label">{fv.field_label}</td>
                  <td className="map-popup-field-value">{formatValue(fv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && loaded && fieldValues.length === 0 && !detail?.city && (
          <p className="map-popup-empty">No details available.</p>
        )}

        {!loading && loaded && fieldValues.length > 5 && (
          <p className="map-popup-more">+{fieldValues.length - 5} more</p>
        )}
      </div>

      <Link to={`/venue/${venue.slug}`} className="map-popup-link">
        View details →
      </Link>
    </div>
  )
}

// Filter input
function FilterInput({ field, value, onChange }) {
  const { field_type, choices, label } = field

  if (field_type === 'boolean') {
    return (
      <select
        className="filter-select"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Any</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    )
  }

  if (field_type === 'choice' && choices?.length > 0) {
    return (
      <select
        className="filter-select"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Any</option>
        {choices.map(choice => (
          <option key={choice.id || choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    )
  }

  if (field_type === 'multi_choice' && choices?.length > 0) {
    const selectedValues = value ? value.split(',').filter(Boolean) : []
    
    const handleCheckbox = (choiceValue, checked) => {
      let newValues = [...selectedValues]
      if (checked) {
        newValues.push(choiceValue)
      } else {
        newValues = newValues.filter(v => v !== choiceValue)
      }
      onChange(newValues.join(','))
    }

    return (
      <div className="filter-checkboxes">
        {choices.map(choice => (
          <label key={choice.id || choice.value} className="filter-checkbox">
            <input
              type="checkbox"
              checked={selectedValues.includes(choice.value)}
              onChange={e => handleCheckbox(choice.value, e.target.checked)}
            />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <input
      type="text"
      className="filter-input"
      placeholder={`Search ${label}…`}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

function CategoryMapPage() {
  const { slug } = useParams()
  const [markers, setMarkers] = useState([])
  const [category, setCategory] = useState(null)
  const [fieldDefs, setFieldDefs] = useState([])
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [venueCount, setVenueCount] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [mapReady, setMapReady] = useState(false)

  const latestReqId = useRef(0)
  const debounceTimer = useRef(null)
  const currentBoundsRef = useRef(null)

  // Kategori bilgisini yükle
  useEffect(() => {
    api.get(`/categories/${slug}/`).then(res => {
      setCategory(res.data)
      setFieldDefs(res.data.field_definitions || [])
      document.title = `${res.data.name} Map | Mapedia`
    })
    
    api.get(`/venues/?category=${slug}&count_only=1`)
      .then(res => setVenueCount(res.data?.count ?? null))
      .catch(() => {})
  }, [slug])

  // Marker'ları getir - minimal data
  const fetchMarkers = useCallback(async (bounds, activeFilters) => {
    if (!bounds) return

    const reqId = ++latestReqId.current

    const bbox = [
      bounds.minLng.toFixed(4),
      bounds.minLat.toFixed(4),
      bounds.maxLng.toFixed(4),
      bounds.maxLat.toFixed(4)
    ].join(',')

    const params = new URLSearchParams({
      category: slug,
      bbox: bbox,
    })

    // Filtreleri ekle
    Object.entries(activeFilters).forEach(([fieldName, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.append(`field__${fieldName}`, value)
      }
    })

    setLoading(true)
    
    try {
      // Optimized marker endpoint - sadece koordinatlar
      const res = await api.get(`/venues/map-markers/?${params.toString()}`)
      
      if (reqId !== latestReqId.current) return
      
      const data = Array.isArray(res.data) ? res.data : []
      setMarkers(data)
    } catch (err) {
      console.error('Marker fetch error:', err)
      // Fallback: normal endpoint
      try {
        const res = await api.get(`/venues/?${params.toString()}`)
        if (reqId !== latestReqId.current) return
        const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
        setMarkers(data.map(v => ({
          id: v.id,
          slug: v.slug,
          name: v.name,
          latitude: v.latitude,
          longitude: v.longitude
        })))
      } catch (err2) {
        console.error('Fallback fetch error:', err2)
      }
    } finally {
      if (reqId === latestReqId.current) {
        setLoading(false)
      }
    }
  }, [slug])

  // Bounds değiştiğinde fetch et (debounced)
  const handleBoundsChange = useCallback((bounds) => {
    currentBoundsRef.current = bounds
    
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchMarkers(bounds, filters)
    }, 250)
  }, [fetchMarkers, filters])

  // Filter değiştiğinde yeniden fetch
  useEffect(() => {
    if (currentBoundsRef.current && mapReady) {
      fetchMarkers(currentBoundsRef.current, filters)
    }
  }, [filters, fetchMarkers, mapReady])

  const handleFilter = (fieldName, value) => {
    setFilters(prev => ({ ...prev, [fieldName]: value }))
  }

  const clearFilters = () => setFilters({})

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== null).length
  const publicFields = fieldDefs.filter(f => f.is_public)

  // Memoized markers
  const markerElements = useMemo(() => {
    return markers
      .filter(v => v.latitude && v.longitude)
      .map(venue => (
        <Marker
          key={venue.id}
          position={[parseFloat(venue.latitude), parseFloat(venue.longitude)]}
        >
          <Popup className="custom-popup" minWidth={240} maxWidth={300}>
            <VenuePopupContent venue={venue} categorySlug={slug} />
          </Popup>
        </Marker>
      ))
  }, [markers, slug])

  // Initial center - user location veya default
  const initialCenter = userLocation 
    ? [userLocation.latitude, userLocation.longitude] 
    : DEFAULT_CENTER

  return (
    <div className="map-page">
      <Navbar />

      <div className="map-layout">
        <div className="map-container">
          <MapContainer
            center={initialCenter}
            zoom={DEFAULT_ZOOM}
            minZoom={3}
            maxZoom={18}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            maxBounds={WORLD_BOUNDS}
            maxBoundsViscosity={1.0}
            whenReady={() => setMapReady(true)}
          >
            <ZoomControl position="topright" />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OSM</a>'
              noWrap={true}
              updateWhenZooming={false}
              updateWhenIdle={true}
              keepBuffer={4}
            />
            <ViewportListener onBoundsChange={handleBoundsChange} />
            <UserLocationHandler onLocationFound={setUserLocation} />
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={60}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              removeOutsideVisibleBounds={true}
              animate={false}
              disableClusteringAtZoom={17}
            >
              {markerElements}
            </MarkerClusterGroup>
          </MapContainer>

          {/* Top Bar */}
          <div className="map-top-bar">
            <Link to={`/category/${slug}`} className="map-back-link">
              ← {category?.name || 'Back'}
            </Link>
            <div className="map-status">
              {loading ? (
                <span className="map-status-loading">⟳ Loading…</span>
              ) : (
                <span className="map-status-count">
                  {markers.length} in view
                  {venueCount !== null && ` · ${venueCount} total`}
                </span>
              )}
            </div>
            <Link to={`/category/${slug}/venues`} className="map-list-link">
              List
            </Link>
          </div>

          {/* Filter FAB */}
          {publicFields.length > 0 && (
            <button
              className={`filter-fab ${activeFilterCount > 0 ? 'filter-fab-active' : ''}`}
              onClick={() => setFilterOpen(true)}
            >
              ⚙ {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          )}

          {/* Add Venue FAB */}
          <Link to={`/contribute?category=${slug}`} className="add-venue-fab">
            +
          </Link>
        </div>
      </div>

      {/* Filter Drawer */}
      {filterOpen && (
        <div className="filter-overlay" onClick={() => setFilterOpen(false)}>
          <div className="filter-drawer" onClick={e => e.stopPropagation()}>
            <div className="filter-drawer-header">
              <h3>Filter</h3>
              <button onClick={() => setFilterOpen(false)} className="filter-close">✕</button>
            </div>
            
            <div className="filter-drawer-body">
              {publicFields.length === 0 ? (
                <p className="filter-empty">No filters available.</p>
              ) : (
                publicFields.map(field => (
                  <div key={field.id} className="filter-item">
                    <label className="filter-label">{field.label}</label>
                    <FilterInput
                      field={field}
                      value={filters[field.name] || ''}
                      onChange={(value) => handleFilter(field.name, value)}
                    />
                  </div>
                ))
              )}
            </div>
            
            <div className="filter-drawer-footer">
              <button 
                onClick={clearFilters} 
                className="btn-clear"
                disabled={activeFilterCount === 0}
              >
                Clear
              </button>
              <button onClick={() => setFilterOpen(false)} className="btn-apply">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryMapPage