import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/CategoryDetailPage.css'

function CategoryDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // slug değiştiğinde loading state'ini tekrar true yapmak iyi bir pratiktir
    setLoading(true)
    api.get(`/categories/${slug}/`)
      .then(res => { 
        setCategory(res.data)
        setLoading(false) 
      })
      .catch(() => { 
        setError('Category not found.')
        setLoading(false) 
      })
  }, [slug])

  if (loading) return (
    <div className="catdetail-page">
      <Navbar />
      <main className="catdetail-main">
        <p className="catdetail-loading">Loading…</p>
      </main>
    </div>
  )

  if (error || !category) return (
    <div className="catdetail-page">
      <Navbar />
      <main className="catdetail-main">
        <p className="catdetail-error">{error || 'Something went wrong.'}</p>
        <Link to="/" className="catdetail-back-link">Back to Home</Link>
      </main>
    </div>
  )

  const publicFields = category.field_definitions?.filter(f => f.is_public) || []

  return (
    <div className="catdetail-page">
      <Navbar />
      <main className="catdetail-main">
        <div className="catdetail-box">

          {/* HEADER */}
          <div className="catdetail-header">
            <div className="catdetail-breadcrumb">
              <Link to="/">Mapedia</Link>
              <span className="catdetail-breadcrumb-sep">›</span>
              <span>{category.name}</span>
            </div>
            <div className="catdetail-title-row">
              {category.icon && <span className="catdetail-icon">{category.icon}</span>}
              <h1 className="catdetail-title">{category.name}</h1>
            </div>
            {category.description && (
              <p className="catdetail-desc">{category.description}</p>
            )}
            <div className="catdetail-btn-row">
              <button
                className="catdetail-map-btn"
                onClick={() => navigate(`/category/${slug}/map`)}
              >
                View on Map →
              </button>
              <Link
                to={`/contribute?category=${slug}`}
                className="catdetail-contribute-btn"
              >
                + Add a Venue
              </Link>
            </div>
          </div>

          {/* STATS */}
          <div className="catdetail-meta">
            {category.venue_count !== undefined && (
              <div className="catdetail-stat">
                <span className="catdetail-stat-value">{category.venue_count}</span>
                <span className="catdetail-stat-label">Venues</span>
              </div>
            )}
            {publicFields.length > 0 && (
              <div className="catdetail-stat">
                <span className="catdetail-stat-value">{publicFields.length}</span>
                <span className="catdetail-stat-label">Fields tracked</span>
              </div>
            )}
            {category.moderators?.length > 0 && (
              <div className="catdetail-stat">
                <span className="catdetail-stat-value">{category.moderators.length}</span>
                <span className="catdetail-stat-label">Moderators</span>
              </div>
            )}
          </div>

          {/* ABOUT */}
          <div className="catdetail-infobox">
            <div className="catdetail-infobox-inner">
              <div className="catdetail-infobox-row">
                <span className="catdetail-infobox-label">License</span>
                <span className="catdetail-infobox-value">
                  {/* HATA DÜZELTİLDİ: <a> etiketi eklendi */}
                  <a 
                    href="https://creativecommons.org/licenses/by-sa/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    CC BY-SA 4.0
                  </a>
                </span>
              </div>
              {category.owner && (
                <div className="catdetail-infobox-row">
                  <span className="catdetail-infobox-label">Owner</span>
                  <span className="catdetail-infobox-value">{category.owner.username}</span>
                </div>
              )}
              {category.moderators?.length > 0 && (
                <div className="catdetail-infobox-row">
                  <span className="catdetail-infobox-label">Moderators</span>
                  <span className="catdetail-infobox-value">
                    {category.moderators.map(m => m.username).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PUBLIC FIELDS */}
          {publicFields.length > 0 && (
            <div className="catdetail-section">
              <h2 className="catdetail-section-title">Fields tracked in this category</h2>
              <p className="catdetail-section-sub">
                Each venue in this category documents the following data points.
              </p>
              <ul className="catdetail-fields">
                {publicFields.map(f => (
                  <li key={f.id} className="catdetail-field-item">
                    <div className="catdetail-field-top">
                      <span className="catdetail-field-label">{f.label}</span>
                      <span className="catdetail-field-type">{f.field_type}</span>
                      {f.is_required && (
                        <span className="catdetail-field-badge required">required</span>
                      )}
                    </div>
                    {f.help_text && (
                      <span className="catdetail-field-help">{f.help_text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CONTRIBUTE CTA */}
          <div className="catdetail-cta">
            <p>
              Know a place that belongs here?{' '}
              <Link to={`/contribute?category=${slug}`}>Add it to Mapedia →</Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

export default CategoryDetailPage