import { useState, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import 'leaflet/dist/leaflet.css'
import '../styles/MapPage.css'

// Leaflet icon fix
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

/* 🔧 Sidebar aç/kapa olduğunda haritayı resize et */
function MapResizer({ sidebarCollapsed }) {
  const map = useMap()

  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize()
    }, 260) // sidebar CSS transition süresi

    return () => clearTimeout(t)
  }, [sidebarCollapsed, map])

  return null
}

function MapPage() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    api.get('/venues/?page_size=100').then(res => {
      setVenues(res.data.results || [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="map-page">
      <Navbar />

      <div className="map-layout">
        {/* SIDEBAR */}
        <aside
          className={`map-sidebar ${
            sidebarCollapsed ? 'sidebar-collapsed' : ''
          }`}
        >
          <h2>Venues ({venues.length})</h2>

          {loading ? (
            <p className="sidebar-loading">Loading...</p>
          ) : (
            <ul className="venue-list">
              {venues.map(v => (
                <li key={v.id}>
                  <Link to={`/venue/${v.id}`} className="venue-list-item">
                    <span className="venue-name">{v.name}</span>
                    <span className="venue-meta">
                      {v.city}
                      {v.city && v.country ? ', ' : ''}
                      {v.country}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* MAP */}
        <div className="map-container">
          {/* sidebar toggle */}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(v => !v)}
          >
            {sidebarCollapsed ? 'Show list' : 'Hide list'}
          </button>

          <MapContainer
            center={[39.9, 32.8]}
            zoom={6}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            {/* resize fix */}
            <MapResizer sidebarCollapsed={sidebarCollapsed} />

            {/* zoom bottom right */}
            <ZoomControl position="bottomright" />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            />

            {venues
              .filter(v => v.latitude && v.longitude)
              .map(v => (
                <Marker
                  key={v.id}
                  position={[parseFloat(v.latitude), parseFloat(v.longitude)]}
                >
                  <Popup>
                    <strong>{v.name}</strong>
                    <br />
                    {v.city}
                    <br />
                    <Link to={`/venue/${v.id}`}>View details →</Link>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>

          {/* FILTER FAB örnek */}
          <button className="filter-fab">Filter</button>
        </div>
      </div>
    </div>
  )
}

export default MapPage