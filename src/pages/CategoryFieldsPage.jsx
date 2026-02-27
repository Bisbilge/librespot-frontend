import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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

function CategoryFieldsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('access')

  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [form, setForm] = useState(EMPTY_FIELD_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadFields() }, [slug])

  const loadFields = () => {
    setLoading(true)
    api.get(`/categories/${slug}/fields/`, {
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
      ? api.patch(`/categories/${slug}/fields/${editingField.id}/edit/`, form, {
          headers: { Authorization: `Bearer ${token}` }
        })
      : api.post(`/categories/${slug}/fields/add/`, form, {
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
    api.delete(`/categories/${slug}/fields/${field.id}/delete/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => loadFields())
  }

  return (
    <div>
      <Navbar />
      <main className="mod-main">
        <div className="mod-layout" style={{ maxWidth: 900, margin: '0 auto' }}>
          <section className="mod-content" style={{ flex: 1 }}>

            <div className="mod-detail-header" style={{ marginBottom: 8 }}>
              <h2>Field Definitions</h2>
              <span className="mod-badge">{slug}</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 24 }}>
              Define the fields contributors fill in for venues in this category.
            </p>

            {/* FIELD MANAGER */}
            <div className="field-manager">
              <div className="field-manager-header">
                <h3>Fields</h3>
                <button className="field-btn-add" onClick={openAddForm}>+ Add Field</button>
              </div>

              {loading ? (
                <p className="mod-empty">Loading fields...</p>
              ) : fields.length === 0 ? (
                <p className="mod-empty">No fields defined yet. Add your first field.</p>
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
            </div>

            {/* DONE BUTTON */}
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <button className="field-btn-save" onClick={() => navigate(`/category/${slug}`)}>
                Done → Go to Map
              </button>
            </div>

          </section>
        </div>
      </main>

      {/* MODAL */}
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

export default CategoryFieldsPage