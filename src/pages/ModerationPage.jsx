import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ModerationPage.css'

const FIELD_TYPES = [
  { value: 'boolean', label: 'Boolean (Yes/No)' },
  { value: 'string', label: 'Short Text' },
  { value: 'text', label: 'Long Text' },
  { value: 'integer', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'url', label: 'URL' },
]

const EMPTY_FIELD_FORM = {
  name: '',
  label: '',
  field_type: 'string',
  is_required: false,
  is_public: true,
  help_text: '',
  order: 0,
}

// ─── FIELD MANAGER ───────────────────────────────────────────
function FieldManager({ categorySlug, token }) {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [form, setForm] = useState(EMPTY_FIELD_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadFields() }, [categorySlug])

  const loadFields = () => {
    setLoading(true)
    api.get(`/categories/${categorySlug}/fields/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setFields(res.data))
      .catch(err => console.error('Fields yüklenemedi:', err))
      .finally(() => setLoading(false))
  }

  const openAddForm = () => {
    setEditingField(null)
    setForm(EMPTY_FIELD_FORM)
    setError('')
    setShowForm(true)
  }

  const openEditForm = (field) => {
    setEditingField(field)
    setForm({
      name: field.name,
      label: field.label,
      field_type: field.field_type,
      is_required: field.is_required,
      is_public: field.is_public,
      help_text: field.help_text || '',
      order: field.order,
    })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingField(null)
    setForm(EMPTY_FIELD_FORM)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.label.trim()) {
      setError('Name and Label are required.')
      return
    }
    setSaving(true)
    setError('')
    const request = editingField
      ? api.patch(`/categories/${categorySlug}/fields/${editingField.id}/edit/`, form, {
          headers: { Authorization: `Bearer ${token}` }
        })
      : api.post(`/categories/${categorySlug}/fields/add/`, form, {
          headers: { Authorization: `Bearer ${token}` }
        })
    request
      .then(() => { loadFields(); closeForm() })
      .catch(err => {
        const data = err.response?.data
        setError(data ? Object.values(data).flat().join(' ') : 'Something went wrong.')
      })
      .finally(() => setSaving(false))
  }

  const handleDelete = (field) => {
    if (!window.confirm(`"${field.label}" alanını silmek istediğinize emin misiniz?`)) return
    api.delete(`/categories/${categorySlug}/fields/${field.id}/delete/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => loadFields())
  }

  if (loading) return <p className="mod-empty">Loading fields...</p>

  return (
    <div className="field-manager">
      <div className="field-manager-header">
        <h3>Category Fields</h3>
        <button className="field-btn-add" onClick={openAddForm}>+ Add Field</button>
      </div>

      {fields.length === 0 ? (
        <p className="mod-empty">No fields defined for this category yet.</p>
      ) : (
        <table className="field-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Label</th>
              <th>Type</th>
              <th>Required</th>
              <th>Help Text</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(f => (
              <tr key={f.id}>
                <td>{f.order}</td>
                <td><code>{f.name}</code></td>
                <td>{f.label}</td>
                <td>{FIELD_TYPES.find(t => t.value === f.field_type)?.label || f.field_type}</td>
                <td>{f.is_required ? '✅' : '—'}</td>
                <td className="field-help-text">{f.help_text || '—'}</td>
                <td className="field-actions">
                  <button className="field-btn-edit" onClick={() => openEditForm(f)}>Edit</button>
                  <button className="field-btn-delete" onClick={() => handleDelete(f)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="field-modal-overlay" onClick={closeForm}>
          <div className="field-modal" onClick={e => e.stopPropagation()}>
            <div className="field-modal-header">
              <h3>{editingField ? 'Edit Field' : 'Add New Field'}</h3>
              <button className="field-modal-close" onClick={closeForm}>✕</button>
            </div>
            {error && <p className="field-error">{error}</p>}
            <div className="field-form-grid">
              <div className="field-form-group">
                <label>Field Name <span className="field-required">*</span></label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. wifi_speed" disabled={!!editingField} />
                {editingField && <small>Name cannot be changed after creation.</small>}
              </div>
              <div className="field-form-group">
                <label>Display Label <span className="field-required">*</span></label>
                <input name="label" value={form.label} onChange={handleChange}
                  placeholder="e.g. WiFi Speed (Mbps)" />
              </div>
              <div className="field-form-group">
                <label>Field Type</label>
                <select name="field_type" value={form.field_type} onChange={handleChange}
                  disabled={!!editingField}>
                  {FIELD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {editingField && <small>Type cannot be changed after creation.</small>}
              </div>
              <div className="field-form-group">
                <label>Order</label>
                <input name="order" type="number" value={form.order}
                  onChange={handleChange} min="0" />
              </div>
              <div className="field-form-group field-form-full">
                <label>Help Text</label>
                <input name="help_text" value={form.help_text} onChange={handleChange}
                  placeholder="Hint shown to users filling in this field" />
              </div>
              <div className="field-form-group field-form-checkboxes">
                <label>
                  <input type="checkbox" name="is_required" checked={form.is_required}
                    onChange={handleChange} />
                  Required
                </label>
                <label>
                  <input type="checkbox" name="is_public" checked={form.is_public}
                    onChange={handleChange} />
                  Public
                </label>
              </div>
            </div>
            <div className="field-modal-actions">
              <button className="field-btn-cancel" onClick={closeForm}>Cancel</button>
              <button className="field-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingField ? 'Save Changes' : 'Add Field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── VENUE MANAGER ───────────────────────────────────────────
function VenueManager({ categorySlug, token }) {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const PAGE_SIZE = 20

  useEffect(() => {
    setPage(1)
    loadVenues(1, search)
  }, [categorySlug, search])

  useEffect(() => {
    loadVenues(page, search)
  }, [page])

  const loadVenues = (p, q) => {
    setLoading(true)
    const params = new URLSearchParams({
      category: categorySlug,
      page: p,
      page_size: PAGE_SIZE,
    })
    if (q?.trim()) params.append('search', q.trim())

    api.get(`/venues/?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.data.results !== undefined) {
          setVenues(res.data.results)
          setTotalCount(res.data.count)
        } else {
          setVenues(res.data)
          setTotalCount(res.data.length)
        }
      })
      .catch(err => console.error('Venues yüklenemedi:', err))
      .finally(() => setLoading(false))
  }

  const handleDelete = (venue) => {
    if (!window.confirm(`"${venue.name}" venue'sunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return
    api.delete(`/venues/${venue.slug}/delete/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => loadVenues(page, search))
      .catch(err => console.error('Silinemedi:', err))
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const getPageNumbers = () => {
    const delta = 2
    const range = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i)
    }
    if (range[0] > 1) {
      range.unshift('...')
      range.unshift(1)
    }
    if (range[range.length - 1] < totalPages) {
      range.push('...')
      range.push(totalPages)
    }
    return range
  }

  return (
    <div className="venue-manager">
      <div className="field-manager-header">
        <h3>
          Venues{' '}
          <span className="venue-count">
            ({totalCount} total{search ? ' · filtered' : ''})
          </span>
        </h3>
        <input
          className="venue-search"
          type="text"
          placeholder="Search venues..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="mod-empty">Loading venues...</p>
      ) : venues.length === 0 ? (
        <p className="mod-empty">{search ? 'No results.' : 'No venues in this category yet.'}</p>
      ) : (
        <>
          <table className="field-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Country</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {venues.map(v => (
                <tr key={v.id}>
                  <td>
                    <Link to={`/venue/${categorySlug}/${v.slug}`} className="venue-manager-link">
                      {v.name}
                    </Link>
                  </td>
                  <td>{v.city || '—'}</td>
                  <td>{v.country || '—'}</td>
                  <td className="field-actions">
                    <Link
                      to={`/venue/${categorySlug}/${v.slug}/edit`}
                      className="field-btn-edit"
                      style={{ textDecoration: 'none', display: 'inline-block' }}
                    >
                      Edit
                    </Link>
                    <button className="field-btn-delete" onClick={() => handleDelete(v)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="venue-pagination">
              <button
                className="venue-page-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >
                ←
              </button>

              {getPageNumbers().map((num, i) =>
                num === '...' ? (
                  <span key={`dots-${i}`} className="venue-page-dots">…</span>
                ) : (
                  <button
                    key={num}
                    className={`venue-page-btn ${page === num ? 'venue-page-btn-active' : ''}`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                )
              )}

              <button
                className="venue-page-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
              >
                →
              </button>

              <span className="venue-page-info">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} / {totalCount}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── CATEGORY SETTINGS ───────────────────────────────────────
function CategorySettings({ categorySlug, token }) {
  const [form, setForm] = useState({ name: '', description: '', icon: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get(`/categories/${categorySlug}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setForm({
          name: res.data.name || '',
          description: res.data.description || '',
          icon: res.data.icon || '',
        })
      })
      .catch(() => setError('Could not load category.'))
      .finally(() => setLoading(false))
  }, [categorySlug])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setSuccess(false)
  }

  const handleSave = () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    api.patch(`/categories/${categorySlug}/update/`, form, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => setSuccess(true))
      .catch(err => {
        const data = err.response?.data
        setError(data ? Object.values(data).flat().join(' ') : 'Something went wrong.')
      })
      .finally(() => setSaving(false))
  }

  if (loading) return <p className="mod-empty">Loading...</p>

  return (
    <div className="cat-settings">
      <div className="field-manager-header">
        <h3>Category Settings</h3>
      </div>

      {error && <p className="field-error">{error}</p>}
      {success && <p className="cat-settings-success">Saved successfully.</p>}

      <div className="cat-settings-form">
        <div className="field-form-group">
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} />
        </div>
        <div className="field-form-group">
          <label>Icon</label>
          <input name="icon" value={form.icon} onChange={handleChange} placeholder="e.g. 🍺 or fa-beer" />
        </div>
        <div className="field-form-group cat-settings-full">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="mod-reject-note"
          />
        </div>
      </div>

      <div className="field-modal-actions" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
        <button className="field-btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ─── MODERATION PAGE ─────────────────────────────────────────
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
  const [activeTab, setActiveTab] = useState('contributions')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    setLoading(true)
    if (categorySlug) {
      loadContributions(categorySlug)
    } else {
      loadCategories()
    }
  }, [categorySlug, token])

  const loadCategories = () => {
    api.get('/contributions/pending/', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setCategories(res.data))
      .catch(err => console.error('Kategoriler yüklenemedi:', err))
      .finally(() => setLoading(false))
  }

  const loadContributions = (slug) => {
    api.get(`/contributions/pending/?category=${slug}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setContributions(res.data))
      .catch(err => console.error('Başvurular yüklenemedi:', err))
      .finally(() => setLoading(false))
  }

  const handleDeleteCategory = (cat) => {
    if (!window.confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz? Tüm venue ve field'lar da silinecek. Bu işlem geri alınamaz.`)) return
    api.delete(`/categories/${cat.slug}/delete/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => setCategories(prev => prev.filter(c => c.slug !== cat.slug)))
      .catch(err => alert(err.response?.data?.detail || 'Could not delete category.'))
  }

  const handleApprove = (id) => {
    if (!window.confirm('Approve this contribution?')) return
    setProcessing(true)
    api.post(`/contributions/${id}/approve/`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => { setContributions(prev => prev.filter(c => c.id !== id)); setSelected(null) })
      .catch(err => console.error('Onay hatası:', err))
      .finally(() => setProcessing(false))
  }

  const handleReject = (id) => {
    if (!window.confirm('Reject this contribution?')) return
    setProcessing(true)
    api.post(`/contributions/${id}/reject/`, { note: rejectNote }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setContributions(prev => prev.filter(c => c.id !== id))
        setSelected(null)
        setRejectNote('')
      })
      .catch(err => console.error('Red hatası:', err))
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
          {payload.field_values && Object.keys(payload.field_values).length > 0 &&
            Object.entries(payload.field_values).map(([key, value]) => (
              <tr key={`fv-${key}`}>
                <td className="mod-payload-key mod-payload-field">{key}</td>
                <td className="mod-payload-val">{String(value)}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )
  }

  if (loading) {
    return (<><Navbar /><div className="mod-loading">Loading...</div></>)
  }

  // Kategori listesi
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
              {categories.map(cat => (
                <div key={cat.id} className="mod-category-card">
                  <Link to={`/moderation/${cat.slug}`} className="mod-category-link">
                    <span className="mod-category-name">{cat.name}</span>
                    <span className={`mod-category-count ${cat.pending_count > 0 ? 'mod-category-count-active' : ''}`}>
                      {cat.pending_count} pending
                    </span>
                  </Link>
                  <div className="mod-category-actions">
                    {cat.is_owner && (
                      <Link to={`/moderation/${cat.slug}/moderators`} className="mod-manage-mods">
                        Manage Moderators
                      </Link>
                    )}
                    {cat.is_owner && (
                      <button
                        className="mod-delete-category-btn"
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        Delete Category
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  // Kategori detay
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
                {contributions.map(c => (
                  <li key={c.id}>
                    <button
                      className={`mod-list-item ${selected?.id === c.id ? 'mod-list-item-active' : ''}`}
                      onClick={() => { setSelected(c); setActiveTab('contributions') }}
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
            <div className="mod-tabs">
              <button
                className={`mod-tab ${activeTab === 'contributions' ? 'mod-tab-active' : ''}`}
                onClick={() => setActiveTab('contributions')}
              >
                Contributions
              </button>
              <button
                className={`mod-tab ${activeTab === 'venues' ? 'mod-tab-active' : ''}`}
                onClick={() => setActiveTab('venues')}
              >
                Venues
              </button>
              <button
                className={`mod-tab ${activeTab === 'fields' ? 'mod-tab-active' : ''}`}
                onClick={() => setActiveTab('fields')}
              >
                Manage Fields
              </button>
              <button
                className={`mod-tab ${activeTab === 'settings' ? 'mod-tab-active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Category Settings
              </button>
            </div>

            {activeTab === 'contributions' && (
              !selected ? (
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
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${selected.payload.latitude}&mlon=${selected.payload.longitude}&zoom=16`}
                        target="_blank" rel="noreferrer" className="mod-osm-link"
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
                      onChange={e => setRejectNote(e.target.value)}
                    />
                  </div>
                  <div className="mod-actions">
                    <button className="mod-btn-approve" onClick={() => handleApprove(selected.id)} disabled={processing}>
                      {processing ? 'Saving...' : 'Approve'}
                    </button>
                    <button className="mod-btn-reject" onClick={() => handleReject(selected.id)} disabled={processing}>
                      Reject
                    </button>
                  </div>
                </div>
              )
            )}

            {activeTab === 'venues' && (
              <VenueManager categorySlug={categorySlug} token={token} />
            )}

            {activeTab === 'fields' && (
              <FieldManager categorySlug={categorySlug} token={token} />
            )}

            {activeTab === 'settings' && (
              <CategorySettings categorySlug={categorySlug} token={token} />
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default ModerationPage