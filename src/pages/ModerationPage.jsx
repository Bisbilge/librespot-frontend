import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ModerationPage.css'

function ModerationPage() {
  const navigate = useNavigate()
  const { categorySlug } = useParams()
  const token = localStorage.getItem('access')

  const [categories, setCategories] = useState([])
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [processing, setProcessing] = useState(false)

  // Token kontrolü ve veri yükleme tetikleyicisi
  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true)
    if (categorySlug) {
      loadContributions(categorySlug)
    } else {
      loadCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, token])

  const loadCategories = () => {
    api.get('/contributions/pending/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => setCategories(res.data))
    .catch((err) => console.error("Kategoriler yüklenemedi:", err))
    .finally(() => setLoading(false))
  }

  const loadContributions = (slug) => {
    api.get(`/contributions/pending/?category=${slug}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => setContributions(res.data))
    .catch((err) => console.error("Başvurular yüklenemedi:", err))
    .finally(() => setLoading(false))
  }

  const handleApprove = (id) => {
    if (!window.confirm('Approve this contribution?')) return
    setProcessing(true)
    api.post(`/contributions/${id}/approve/`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      setContributions((prev) => prev.filter((c) => c.id !== id))
      setSelected(null)
    })
    .catch((err) => console.error("Onay hatası:", err))
    .finally(() => setProcessing(false))
  }

  const handleReject = (id) => {
    if (!window.confirm('Reject this contribution?')) return
    setProcessing(true)
    api.post(`/contributions/${id}/reject/`, { note: rejectNote }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      setContributions((prev) => prev.filter((c) => c.id !== id))
      setSelected(null)
      setRejectNote('')
    })
    .catch((err) => console.error("Red hatası:", err))
    .finally(() => setProcessing(false))
  }

  const renderPayload = (payload) => {
    const skip = ['field_values']
    const fields = Object.entries(payload).filter(
      ([key, value]) => !skip.includes(key) && value !== '' && value !== null
    )
    
    return (
      <table className="mod-payload-table">
        <tbody>
          {fields.map(([key, value]) => (
            <tr key={key}>
              <td className="mod-payload-key">{key}</td>
              <td className="mod-payload-val">{String(value)}</td>
            </tr>
          ))}
          {payload.field_values && Object.keys(payload.field_values).length > 0 && (
            Object.entries(payload.field_values).map(([key, value]) => (
              <tr key={`fv-${key}`}>
                <td className="mod-payload-key mod-payload-field">{key}</td>
                <td className="mod-payload-val">{String(value)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    )
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="mod-loading">Loading...</div>
      </>
    )
  }

  // Kategori Listesi Ekranı
  if (!categorySlug) {
    return (
      <div>
        <Navbar />
        <main className="mod-categories-main">
          <h1 className="mod-categories-title">Moderation Center</h1>
          <p className="mod-categories-desc">Select a category to review pending contributions.</p>

          {categories.length === 0 ? (
            <p className="mod-empty">You don't have moderation permissions for any category.</p>
          ) : (
            <div className="mod-categories-grid">
              {categories.map((cat) => (
                <div key={cat.id} className="mod-category-card">
                  <Link to={`/moderation/${cat.slug}`} className="mod-category-link">
                    <span className="mod-category-name">{cat.name}</span>
                    <span className={`mod-category-count ${cat.pending_count > 0 ? 'mod-category-count-active' : ''}`}>
                      {cat.pending_count} pending
                    </span>
                  </Link>
                  {cat.is_owner && (
                    <Link
                      to={`/moderation/${cat.slug}/moderators`}
                      className="mod-manage-mods"
                    >
                      Manage Moderators
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  // Moderasyon Detay Ekranı
  return (
    <div>
      <Navbar />
      <main className="mod-main">
        <div className="mod-layout">
          <aside className="mod-sidebar">
            <div className="mod-back">
              <Link to="/moderation">← Back to Categories</Link>
            </div>
            <h2>Pending Review</h2>
            <p className="mod-count">
              {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
            </p>

            {contributions.length === 0 ? (
              <p className="mod-empty">No pending items.</p>
            ) : (
              <ul className="mod-list">
                {contributions.map((c) => (
                  <li key={c.id}>
                    <button
                      className={`mod-list-item ${selected?.id === c.id ? 'mod-list-item-active' : ''}`}
                      onClick={() => setSelected(c)}
                    >
                      <span className="mod-item-type">{c.contribution_type.replace('_', ' ')}</span>
                      <span className="mod-item-name">{c.payload.name || 'Unnamed Entry'}</span>
                      <span className="mod-item-meta">
                        by {c.contributor} · {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="mod-content">
            {!selected ? (
              <div className="mod-empty-state">
                <p>Select a contribution to start reviewing</p>
              </div>
            ) : (
              <div className="mod-detail">
                <div className="mod-detail-header">
                  <h2>{selected.payload.name || 'Review Submission'}</h2>
                  <span className="mod-badge">{selected.contribution_type.replace('_', ' ')}</span>
                </div>

                <p className="mod-contributor">
                  Submitted by <strong>{selected.contributor}</strong> on {new Date(selected.created_at).toLocaleString()}
                </p>

                <div className="mod-section">
                  <h3>Submitted Data</h3>
                  {renderPayload(selected.payload)}
                </div>

                {selected.payload.latitude && selected.payload.longitude && (
                  <div className="mod-section">
                    <h3>Location</h3>
                    {/* HATA DÜZELTİLDİ: <a> etiketi eklendi */}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${selected.payload.latitude}&mlon=${selected.payload.longitude}&zoom=16`}
                      target="_blank"
                      rel="noreferrer"
                      className="mod-osm-link"
                    >
                      View on OpenStreetMap
                    </a>
                  </div>
                )}

                <div className="mod-section">
                  <h3>Rejection Note (optional)</h3>
                  <textarea
                    className="mod-reject-note"
                    placeholder="Provide a reason if rejecting..."
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                </div>

                <div className="mod-actions">
                  <button
                    className="mod-btn-approve"
                    onClick={() => handleApprove(selected.id)}
                    disabled={processing}
                  >
                    {processing ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    className="mod-btn-reject"
                    onClick={() => handleReject(selected.id)}
                    disabled={processing}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default ModerationPage