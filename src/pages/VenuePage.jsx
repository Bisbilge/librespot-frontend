import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import Navbar from '../components/Navbar'
import api from '../api/client'
import 'leaflet/dist/leaflet.css'
import '../styles/VenuePage.css'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

function VenuePage() {
  const { categorySlug, venueSlug } = useParams()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportSent, setReportSent] = useState(false)

  // fetchVenue fonksiyonunu useCallback içine alıyoruz ki sonsuz döngü olmasın
  const fetchVenue = useCallback(async (retryWithoutToken = false) => {
    if (!retryWithoutToken) setLoading(true)
    
    // Eğer retry yapıyorsak token gönderme, yapmıyorsak localStorage'dan al
    const token = retryWithoutToken ? null : localStorage.getItem('access')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    try {
      const res = await api.get(`/venues/${venueSlug}/?category=${categorySlug}`, { headers })
      setVenue(res.data)
    } catch (err) {
      // 401 Hatası: Token bayatlamışsa sil ve misafir olarak tekrar dene
      if (err.response?.status === 401 && !retryWithoutToken) {
        console.warn("Süresi dolmuş token temizleniyor, misafir olarak deneniyor...")
        localStorage.removeItem('access')
        localStorage.removeItem('refresh') // Varsa refresh'i de temizle
        fetchVenue(true) // Token'sız tekrar çağır
        return
      }
      console.error('Venue yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }, [venueSlug, categorySlug])

  useEffect(() => {
    fetchVenue()
  }, [fetchVenue])

  const submitReport = () => {
    if (!venue) return
    api.post('/reports/', {
      venue: venue.id,
      reason: reportReason,
      description: reportDesc
    }).then(() => {
      setReportSent(true)
      setReportOpen(false)
    }).catch(err => console.error('Rapor gönderilemedi:', err))
  }

  if (loading) return <><Navbar /><div className="venue-loading">Loading...</div></>
  
  if (!venue) return (
    <>
      <Navbar />
      <div className="venue-loading">
        <h2>Venue not found</h2>
        <p>The link might be broken or the venue is no longer active.</p>
        <Link to="/" className="btn-edit">Back to Home</Link>
      </div>
    </>
  )

  return (
    <div>
      <Navbar />
      <main className="venue-main">
        <div className="venue-layout">

          <div className="venue-content">
            <nav className="venue-breadcrumb">
              <Link to="/">Home</Link>
              <span> / </span>
              <Link to={`/category/${categorySlug}`}>{venue.category_name}</Link>
              <span> / </span>
              <span>{venue.name}</span>
            </nav>

            <h1 className="venue-title">{venue.name}</h1>

            <div className="venue-meta-row">
              {venue.city && (
                <span className="venue-tag">
                  {venue.city}{venue.country ? `, ${venue.country}` : ''}
                </span>
              )}
              {venue.category_name && (
                <Link to={`/category/${categorySlug}`} className="venue-tag">{venue.category_name}</Link>
              )}
            </div>

            {venue.address && <p className="venue-address">{venue.address}</p>}

            {venue.field_values && venue.field_values.length > 0 && (
              <div className="venue-fields">
                <h2>Details</h2>
                <table className="fields-table">
                  <tbody>
                    {venue.field_values.map((fv) => (
                      <tr key={fv.id}>
                        <td className="field-label">{fv.field_label}</td>
                        <td className="field-value">
                          {fv.field_type === 'boolean'
                            ? (fv.value === 'true' || fv.value === true ? 'Yes' : 'No')
                            : fv.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="venue-actions">
              {venue.can_edit && (
                <Link to={`/venue/${categorySlug}/${venueSlug}/edit`} className="btn-edit">
                  Edit this venue
                </Link>
              )}
              <button className="btn-report" onClick={() => setReportOpen(!reportOpen)}>
                {reportOpen ? 'Cancel Report' : 'Report an issue'}
              </button>
              {reportSent && <span className="report-sent">Report sent, thank you.</span>}
            </div>

            {reportOpen && (
              <div className="report-form">
                <h3>Report an Issue</h3>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="filter-select">
                  <option value="">Select reason...</option>
                  <option value="closed">Venue Closed / Not Found</option>
                  <option value="wrong_location">Wrong Location on Map</option>
                  <option value="wrong_info">Incorrect Information</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="duplicate">Duplicate Entry</option>
                  <option value="other">Other</option>
                </select>
                <textarea placeholder="Additional details (optional)" value={reportDesc}
                  onChange={e => setReportDesc(e.target.value)} className="report-textarea" />
                <button onClick={submitReport} disabled={!reportReason} className="btn-apply">
                  Submit Report
                </button>
              </div>
            )}

            <div className="venue-footer">
              <p>Added: {new Date(venue.created_at).toLocaleDateString()}</p>
              <p>Data licensed under CC BY-SA 4.0</p>
            </div>
          </div>

          <aside className="venue-sidebar">
            {venue.latitude && venue.longitude && (
              <div className="venue-map">
                <MapContainer
                  center={[parseFloat(venue.latitude), parseFloat(venue.longitude)]}
                  zoom={16}
                  style={{ height: '250px', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={[parseFloat(venue.latitude), parseFloat(venue.longitude)]} />
                </MapContainer>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${venue.latitude}&mlon=${venue.longitude}&zoom=16`}
                  target="_blank" rel="noreferrer" className="osm-link"
                >
                  View on OpenStreetMap
                </a>
              </div>
            )}

            <div className="venue-info-box">
              <table className="info-table">
                <tbody>
                  <tr>
                    <td>Category</td>
                    <td><Link to={`/category/${categorySlug}`}>{venue.category_name}</Link></td>
                  </tr>
                  {venue.city && <tr><td>City</td><td>{venue.city}</td></tr>}
                  {venue.country && <tr><td>Country</td><td>{venue.country}</td></tr>}
                  {venue.latitude && (
                    <tr><td>Coordinates</td><td>{venue.latitude}, {venue.longitude}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </aside>

        </div>
      </main>
    </div>
  )
}

export default VenuePage