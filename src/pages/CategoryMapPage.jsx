import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
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

function CategoryMapPage() {
  const { slug } = useParams()
  const [venues, setVenues] = useState([])
  const [filteredVenues, setFilteredVenues] = useState([])
  const [category, setCategory] = useState(null)
  const [fieldDefs, setFieldDefs] = useState([])
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    api.get(`/categories/${slug}/`).then(res => {
      setCategory(res.data)
      setFieldDefs(res.data.field_definitions || [])
    })
    api.get(`/venues/?category=${slug}&page_size=500`).then(res => {
      const data = res.data.results || []
      setVenues(data)
      setFilteredVenues(data)
      setLoading(false)
    })
  }, [slug])

  useEffect(() => {
    const activeFilters = Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
    if (activeFilters.length === 0) {
      setFilteredVenues(venues)
      return
    }
    const result = venues.filter(venue => {
      return activeFilters.every(([fieldName, filterValue]) => {
        const fieldValue = venue.field_values?.find(fv => fv.field_label === fieldName)
        if (!fieldValue) return false
        return fieldValue.value.toLowerCase().includes(String(filterValue).toLowerCase())
      })
    })
    setFilteredVenues(result)
  }, [filters, venues])

  const handleFilter = (fieldName, value) => {
    setFilters(prev => ({ ...prev, [fieldName]: value }))
  }

  const clearFilters = () => setFilters({})

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== null).length

  return (
    <div className="map-page">
      <Navbar />
      <div className="map-layout">
        <aside className={`map-sidebar${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
          <h2>{category ? category.name : '...'}</h2>
          <p className="sidebar-count">{filteredVenues.length} / {venues.length} venues</p>
          {loading ? (
            <p className="sidebar-loading">Loading...</p>
          ) : (
            <ul className="venue-list">
              {filteredVenues.map(venue => (
                <li key={venue.id}>
                  <Link to={`/venue/${venue.id}`} className="venue-list-item">
                    <span className="venue-name">{venue.name}</span>
                    <span className="venue-meta">
                      {venue.city}{venue.city && venue.country ? ', ' : ''}{venue.country}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="map-container">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀ Hide List' : '▶ Show List'}
          </button>

          <MapContainer
            center={[39.9, 32.8]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            />
            {filteredVenues
              .filter(v => v.latitude && v.longitude)
              .map(venue => (
                <Marker
                  key={venue.id}
                  position={[parseFloat(venue.latitude), parseFloat(venue.longitude)]}
                >
                  <Popup>
                    <strong>{venue.name}</strong><br />
                    {venue.city}<br />
                    <Link to={`/venue/${venue.id}`}>View details →</Link>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>

          <button
            className={`filter-fab ${activeFilterCount > 0 ? 'filter-fab-active' : ''}`}
            onClick={() => setFilterOpen(true)}
          >
            ⚙ Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
      </div>

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
                  {field.help_text && (
                    <p className="filter-help">{field.help_text}</p>
                  )}
                  {field.field_type === 'boolean' ? (
                    <select
                      onChange={e => handleFilter(field.label, e.target.value)}
                      value={filters[field.label] || ''}
                      className="filter-select"
                    >
                      <option value="">Any</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={field.help_text || `Search ${field.label}...`}
                      value={filters[field.label] || ''}
                      onChange={e => handleFilter(field.label, e.target.value)}
                      className="filter-input"
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