// src/pages/VenuePage.jsx

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { Helmet } from 'react-helmet-async' 
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

function FieldValueDisplay({ fv }) {
  if (fv.field_type === 'boolean') {
    const isYes = fv.display_value === 'Yes' || fv.value === 'True' || fv.value === 'true' || fv.value === true
    return isYes
      ? <span className="field-bool yes">Yes</span>
      : <span className="field-bool no">No</span>
  }
  if (fv.field_type === 'url') {
    return <a href={fv.value} target="_blank" rel="noopener noreferrer">{fv.value}</a>
  }
  return <span>{fv.display_value || fv.value}</span>
}

// ============ RATING COMPONENTS ============

function StarRating({ rating, size = 'medium', interactive = false, onRate = null }) {
  const [hoverRating, setHoverRating] = useState(0)
  
  const sizeClass = size === 'small' ? 'stars-small' : size === 'large' ? 'stars-large' : ''
  
  const handleClick = (star) => {
    if (interactive && onRate) {
      onRate(star)
    }
  }
  
  const displayRating = hoverRating || rating || 0
  
  return (
    <div 
      className={`star-rating ${sizeClass} ${interactive ? 'interactive' : ''}`}
      onMouseLeave={() => interactive && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= displayRating ? 'filled' : ''}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function RatingBreakdown({ breakdown, totalCount }) {
  if (!breakdown || totalCount === 0) return null
  
  return (
    <div className="rating-breakdown">
      {[5, 4, 3, 2, 1].map(star => {
        const count = breakdown[star] || 0
        const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0
        return (
          <div key={star} className="breakdown-row">
            <span className="breakdown-label">{star}★</span>
            <div className="breakdown-bar">
              <div className="breakdown-fill" style={{ width: `${percentage}%` }} />
            </div>
            <span className="breakdown-count">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

function RatingForm({ venueSlug, userRating, onRatingSubmit }) {
  const [score, setScore] = useState(userRating || 0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const isLoggedIn = !!localStorage.getItem('access')
  
  const handleSubmit = async () => {
    if (!score) {
      setError('Please select a rating')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const res = await api.post(`/venues/${venueSlug}/rate/`, { score, comment })
      onRatingSubmit(res.data)
      setComment('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit rating')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your rating?')) return
    
    setLoading(true)
    try {
      const res = await api.delete(`/venues/${venueSlug}/rate/delete/`)
      onRatingSubmit(res.data)
      setScore(0)
      setComment('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete rating')
    } finally {
      setLoading(false)
    }
  }
  
  if (!isLoggedIn) {
    return (
      <div className="rating-form">
        <p className="rating-login-prompt">
          <Link to="/login">Log in</Link> to rate this venue
        </p>
      </div>
    )
  }
  
  return (
    <div className="rating-form">
      <h4>{userRating ? 'Update your rating' : 'Rate this venue'}</h4>
      
      <StarRating 
        rating={score} 
        size="large" 
        interactive={true} 
        onRate={setScore} 
      />
      
      <textarea
        placeholder="Add a comment (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        maxLength={500}
        className="rating-comment"
      />
      
      {error && <p className="rating-error">{error}</p>}
      
      <div className="rating-actions">
        <button 
          onClick={handleSubmit} 
          disabled={loading || !score}
          className="btn-apply"
        >
          {loading ? 'Submitting...' : (userRating ? 'Update Rating' : 'Submit Rating')}
        </button>
        
        {userRating && (
          <button 
            onClick={handleDelete} 
            disabled={loading}
            className="btn-report"
          >
            Delete Rating
          </button>
        )}
      </div>
    </div>
  )
}

function RatingsList({ ratings }) {
  if (!ratings || ratings.length === 0) return null
  
  return (
    <div className="ratings-list">
      <h4>Recent Reviews</h4>
      {ratings.map(r => (
        <div key={r.id} className="rating-item">
          <div className="rating-header">
            <Link to={`/profile/${r.user.username}`} className="rating-user">
              {r.user.avatar && <img src={r.user.avatar} alt="" className="rating-avatar" />}
              <span>@{r.user.username}</span>
            </Link>
            <StarRating rating={r.score} size="small" />
          </div>
          {r.comment && <p className="rating-comment-text">{r.comment}</p>}
          <span className="rating-date">
            {new Date(r.created_at).toLocaleDateString('en-GB', { 
              year: 'numeric', month: 'short', day: 'numeric' 
            })}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============ MAIN COMPONENT ============

function VenuePage() {
  const { venueSlug } = useParams()
  const navigate = useNavigate()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportSent, setReportSent] = useState(false)

  const fetchVenue = useCallback(async (retryWithoutToken = false) => {
    if (!retryWithoutToken) setLoading(true)
    const token = retryWithoutToken ? null : localStorage.getItem('access')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    try {
      const res = await api.get(`/venues/${venueSlug}/`, { headers })
      setVenue(res.data)
    } catch (err) {
      if (err.response?.status === 401 && !retryWithoutToken) {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        fetchVenue(true)
        return
      }
    } finally {
      setLoading(false)
    }
  }, [venueSlug])

  useEffect(() => { fetchVenue() }, [fetchVenue])

  const handleRatingSubmit = (data) => {
    // Rating sonrası venue'yu güncelle
    setVenue(prev => ({
      ...prev,
      average_rating: data.average_rating,
      rating_count: data.rating_count,
      user_rating: data.rating?.score || null
    }))
    // Sayfayı yeniden yükle (rating listesi için)
    fetchVenue()
  }

  const submitReport = () => {
    if (!venue) return
    api.post('/reports/', { venue: venue.id, reason: reportReason, description: reportDesc })
      .then(() => { setReportSent(true); setReportOpen(false); setReportReason(''); setReportDesc('') })
      .catch(err => console.error('Report failed:', err))
  }

  if (loading) return <div><Navbar /><div className="venue-loading">Loading…</div></div>

  if (!venue) return (
    <div>
      <Navbar />
      <div className="venue-loading">
        <h2>Venue not found</h2>
        <p>The link might be broken or the venue is no longer active.</p>
        <Link to="/" className="btn-edit" style={{ marginTop: 16, display: 'inline-block' }}>Back to Home</Link>
      </div>
    </div>
  )

  const primaryCat = venue.categories?.[0]
  
  const pageTitle = `${venue.name}${venue.city ? ` - ${venue.city}` : ''} | Mapedia`;
  const pageDesc = `${venue.name} hakkında konum, ${venue.categories?.map(c => c.category_name).join(', ')} özellikleri ve kullanıcı bilgileri Mapedia'da.`;

  // GOOGLE RICH SNIPPETS (SCHEMA) OLUŞTURUCU
// 1. Kategorilere göre Google Schema tipini belirleyen "Akıllı Sözlük"
  const getGoogleSchemaType = (categories) => {
    if (!categories || categories.length === 0) return "LocalBusiness"; // Tanımsızsa joker eleman kullan

    const primaryCat = categories[0].category_slug.toLowerCase();

    // Mapedia kategorilerini Google Schema türleriyle eşleştiriyoruz
    const typeMap = {
      'vegan': 'Restaurant',
      'restoran': 'Restaurant',
      'kafe': 'CafeOrCoffeeShop',
      'muze': 'Museum',
      'tarihi-yer': 'TouristAttraction',
      'park': 'Park',
      'otel': 'LodgingBusiness'
    };

    return typeMap[primaryCat] || "LocalBusiness"; 
  };

  // 2. GOOGLE RICH SNIPPETS (SCHEMA) OLUŞTURUCU
  // Not: venue.schema_data'yı şimdilik sildik çünkü backend hatalı format yolluyor olabilir.
  // Kontrol tamamen bizde.
  const schemaData = {
    "@context": "https://schema.org",
    "@type": getGoogleSchemaType(venue.categories), // Artık dinamik!
    "name": venue.name,
    "description": pageDesc,
    "image": "https://mapedia.org/mapedia.svg", // Google işletmeler için görsel ister (logonu ekledik)
    "url": `https://mapedia.org/venue/${venueSlug}`,
    // Koordinatlar varsa ekle
    ...(venue.latitude && venue.longitude && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": parseFloat(venue.latitude),
        "longitude": parseFloat(venue.longitude)
      }
    }),
    // Adres bilgisi varsa ekle
    ...(venue.city || venue.country ? {
      "address": {
        "@type": "PostalAddress",
        "addressLocality": venue.city,
        "addressCountry": venue.country || "Türkiye"
      }
    } : {}),
    // Puanlama varsa AggregateRating ekle (Google'da yıldız çıkartacak kısım)
    ...(venue.average_rating && venue.rating_count > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": venue.average_rating,
        "reviewCount": venue.rating_count,
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {})
  };

  return (
    <div>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`https://mapedia.org/venue/${venueSlug}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://mapedia.org/venue/${venueSlug}`} />
        {/* SCRIPT'I BURADAN ÇIKARDIK */}
      </Helmet>

      {/* SCRIPT'I BURAYA, HELMET'İN DIŞINA VE SAYFANIN EN ÜSTÜNE EKLİYORUZ */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} 
      />

      <Navbar />
      <main className="venue-main">
        <div className="venue-layout">
          <div className="venue-content">
            
            <nav className="venue-breadcrumb">
              <Link to="/">Mapedia</Link>
              <span className="venue-breadcrumb-sep">›</span>
              {primaryCat && (
                <>
                  <Link to={`/category/${primaryCat.category_slug}`}>{primaryCat.category_name}</Link>
                  <span className="venue-breadcrumb-sep">›</span>
                </>
              )}
              <span>{venue.name}</span>
            </nav>

            <h1 className="venue-title">{venue.name}</h1>

            {/* ============ RATING SUMMARY ============ */}
            {(venue.average_rating || venue.rating_count > 0) && (
              <div className="venue-rating-summary">
                <StarRating rating={Math.round(venue.average_rating)} />
                <span className="rating-value">{venue.average_rating}</span>
                <span className="rating-count">({venue.rating_count} {venue.rating_count === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}

            <div className="venue-meta-row">
              {venue.city && (
                <span className="venue-tag">
                  📍 {venue.city}{venue.country ? `, ${venue.country}` : ''}
                </span>
              )}
              {venue.categories?.map(cat => (
                <Link key={cat.category_slug} to={`/category/${cat.category_slug}`} className="venue-tag">
                  {cat.category_name}
                </Link>
              ))}
            </div>

            {venue.categories?.map(cat => (
              cat.field_values?.length > 0 && (
                <div key={cat.category_slug} className="venue-fields">
                  <h2>{cat.category_name}</h2>
                  <table className="fields-table">
                    <tbody>
                      {cat.field_values.map(fv => (
                        <tr key={fv.id}>
                          <td className="field-label">{fv.field_label}</td>
                          <td className="field-value"><FieldValueDisplay fv={fv} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ))}

            {/* ============ RATING SECTION ============ */}
            <div className="venue-rating-section">
              <h2>Ratings & Reviews</h2>
              
              <div className="rating-overview">
                <div className="rating-big">
                  <span className="rating-big-number">{venue.average_rating || '—'}</span>
                  <StarRating rating={Math.round(venue.average_rating || 0)} />
                  <span className="rating-total">{venue.rating_count} reviews</span>
                </div>
                
                <RatingBreakdown 
                  breakdown={venue.rating_breakdown} 
                  totalCount={venue.rating_count} 
                />
              </div>
              
              <RatingForm 
                venueSlug={venueSlug}
                userRating={venue.user_rating}
                onRatingSubmit={handleRatingSubmit}
              />
              
              <RatingsList ratings={venue.recent_ratings} />
              
              {venue.rating_count > 5 && (
                <Link to={`/venue/${venueSlug}/reviews`} className="btn-edit" style={{ marginTop: 16 }}>
                  View all {venue.rating_count} reviews →
                </Link>
              )}
            </div>

            <div className="venue-actions">
              <Link to={`/venue/${venueSlug}/edit`} className="btn-edit">Edit</Link>
              <button className="btn-edit" onClick={() => navigate(`/venue/${venueSlug}/add-category`)}>
                + Add Category
              </button>
              <button className="btn-report" onClick={() => setReportOpen(!reportOpen)}>
                {reportOpen ? 'Cancel' : 'Report an issue'}
              </button>
              {reportSent && <span className="report-sent">✓ Report sent, thank you.</span>}
            </div>

            {reportOpen && (
              <div className="report-form">
                <h3>Report an Issue</h3>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="filter-select">
                  <option value="">Select reason…</option>
                  <option value="closed">Venue Closed / Not Found</option>
                  <option value="wrong_location">Wrong Location on Map</option>
                  <option value="wrong_info">Incorrect Information</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="duplicate">Duplicate Entry</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  placeholder="Additional details (optional)"
                  value={reportDesc}
                  onChange={e => setReportDesc(e.target.value)}
                  className="report-textarea"
                />
                <button onClick={submitReport} disabled={!reportReason} className="btn-apply">Submit Report</button>
              </div>
            )}

            <div className="venue-footer">
              <span>Added: {new Date(venue.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>
                Data licensed under{' '}
                <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
              </span>
            </div>
          </div>

          <aside className="venue-sidebar">
            {venue.latitude && venue.longitude && (
              <div className="venue-map">
                <MapContainer
                  center={[parseFloat(venue.latitude), parseFloat(venue.longitude)]}
                  zoom={16}
                  style={{ height: '220px', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={[parseFloat(venue.latitude), parseFloat(venue.longitude)]} />
                </MapContainer>
                
                <a 
                  href={`https://www.openstreetmap.org/?mlat=${venue.latitude}&mlon=${venue.longitude}&zoom=16`}
                  target="_blank" rel="noreferrer" className="osm-link"
                >
                  View on OpenStreetMap ↗
                </a>
                
                <a 
                  href={`http://googleusercontent.com/maps.google.com/?q=${venue.latitude},${venue.longitude}`}
                  target="_blank" rel="noreferrer" className="osm-link"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  Open on Google Maps ↗
                </a>
              </div>
            )}

            <div className="venue-info-box">
              <div className="info-box-title">About this venue</div>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td>Categories</td>
                    <td>
                      {venue.categories?.map((cat, i) => (
                        <span key={cat.category_slug}>
                          {i > 0 && ', '}
                          <Link to={`/category/${cat.category_slug}`}>{cat.category_name}</Link>
                        </span>
                      ))}
                    </td>
                  </tr>
                  
                  {venue.average_rating && (
                    <tr>
                      <td>Rating</td>
                      <td>
                        <span className="info-rating">
                          {venue.average_rating} ★ ({venue.rating_count})
                        </span>
                      </td>
                    </tr>
                  )}
                  
                  {venue.contributors && venue.contributors.length > 0 && (
                    <tr>
                      <td>Contributors</td>
                      <td>
                        {venue.contributors.map((contributor, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            <Link to={`/profile/${contributor.username}`} className="contributor-link">
                              @{contributor.username}
                            </Link>
                          </span>
                        ))}
                      </td>
                    </tr>
                  )}

                  {venue.city && <tr><td>City</td><td>{venue.city}</td></tr>}
                  {venue.country && <tr><td>Country</td><td>{venue.country}</td></tr>}
                  {venue.latitude && (
                    <tr>
                      <td>Coordinates</td>
                      <td className="venue-coords">{venue.latitude}, {venue.longitude}</td>
                    </tr>
                  )}
                  <tr>
                    <td>License</td>
                    <td>
                      <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
                        CC BY-SA 4.0
                      </a>
                    </td>
                  </tr>
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