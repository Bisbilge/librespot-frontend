import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import 'leaflet/dist/leaflet.css'
import '../styles/MapPage.css'

// Leaflet ikon sorunu için fix
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

function MapPage() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)

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
        <aside className="map-sidebar">
          <h2>Venues ({venues.length})</h2>
          {loading ? (
            <p className="sidebar-loading">Loading...</p>
          ) : (
            <ul className="venue-list">
              {venues.map(venue => (
                <li key={venue.id}>
                  <Link to={`/venue/${venue.id}`} className="venue-list-item">
                    <span className="venue-name">{venue.name}</span>
                    <span className="venue-meta">{venue.city}{venue.city && venue.country ? ', ' : ''}{venue.country}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <div className="map-container">
          <MapContainer
            center={[39.9, 32.8]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            />
            {venues
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
        </div>
      </div>
    </div>
  )
}

export default MapPage