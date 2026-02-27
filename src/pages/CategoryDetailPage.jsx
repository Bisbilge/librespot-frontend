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
    api.get(`/categories/${slug}/`)
      .then(res => { setCategory(res.data); setLoading(false) })
      .catch(() => { setError('Category not found.'); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div>
      <Navbar />
      <main className="catdetail-main">
        <p className="catdetail-loading">Loading…</p>
      </main>
    </div>
  )

  if (error) return (
    <div>
      <Navbar />
      <main className="catdetail-main">
        <p className="catdetail-error">{error}</p>
      </main>
    </div>
  )

  const publicFields = category.field_definitions?.filter(f => f.is_public) || []

  return (
    <div>
      <Navbar />
      <main className="catdetail-main">
        <div className="catdetail-box">

          {/* HEADER */}
          <div className="catdetail-header">
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

          {/* BİLGİLER */}
          <div className="catdetail-meta">

            {category.venue_count !== undefined && (
              <div className="catdetail-stat">
                <span className="catdetail-stat-value">{category.venue_count}</span>
                <span className="catdetail-stat-label">venues</span>
              </div>
            )}

            {publicFields.length > 0 && (
              <div className="catdetail-stat">
                <span className="catdetail-stat-value">{publicFields.length}</span>
                <span className="catdetail-stat-label">fields</span>
              </div>
            )}

          </div>

          {/* OWNER & MODERATORS */}
          <div className="catdetail-section">
            <h2 className="catdetail-section-title">Community</h2>
            {category.owner && (
              <div className="catdetail-person-row">
                <span className="catdetail-role">Owner</span>
                <span className="catdetail-username">{category.owner.username}</span>
              </div>
            )}
            {category.moderators?.length > 0 && (
              <div className="catdetail-person-row">
                <span className="catdetail-role">Moderators</span>
                <span className="catdetail-username">
                  {category.moderators.map(m => m.username).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* PUBLIC FIELDS */}
          {publicFields.length > 0 && (
            <div className="catdetail-section">
              <h2 className="catdetail-section-title">Fields tracked in this category</h2>
              <ul className="catdetail-fields">
                {publicFields.map(f => (
                  <li key={f.id} className="catdetail-field-item">
                    <span className="catdetail-field-label">{f.label}</span>
                    <span className="catdetail-field-type">{f.field_type}</span>
                    {f.help_text && (
                      <span className="catdetail-field-help">{f.help_text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}



        </div>
      </main>
    </div>
  )
}

export default CategoryDetailPage