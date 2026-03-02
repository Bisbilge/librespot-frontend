import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/CategoryFieldsPage.css'

const FIELD_TYPES = [
  { value: 'boolean', label: 'Boolean (Yes/No)' },
  { value: 'string', label: 'Short Text' },
  { value: 'text', label: 'Long Text' },
  { value: 'integer', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'url', label: 'URL' },
  { value: 'choice', label: 'Single Choice' },
  { value: 'multi_choice', label: 'Multiple Choice' },
]

const CHOICE_FIELD_TYPES = ['choice', 'multi_choice']

const EMPTY_FIELD = {
  name: '',
  label: '',
  field_type: 'string',
  is_required: false,
  is_public: true,
  help_text: '',
  order: 0,
}

const EMPTY_CHOICE = { value: '', label: '', icon: '', order: 0 }

function CategoryFieldsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('access')

  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FIELD)
  const [editChoices, setEditChoices] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FIELD)
  const [addChoices, setAddChoices] = useState([{ ...EMPTY_CHOICE }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFields()
  }, [slug])

  const loadFields = () => {
    setLoading(true)
    api.get(`/categories/${slug}/fields/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setFields(res.data))
      .catch(err => console.error('Fields yüklenemedi:', err))
      .finally(() => setLoading(false))
  }

  // ─────────────────────────────────────────────────────────────
  // EDIT
  // ─────────────────────────────────────────────────────────────
  const startEdit = (field) => {
    setEditingId(field.id)
    setEditForm({
      name: field.name,
      label: field.label,
      field_type: field.field_type,
      is_required: field.is_required,
      is_public: field.is_public,
      help_text: field.help_text || '',
      order: field.order,
    })
    // Choices varsa yükle
    if (CHOICE_FIELD_TYPES.includes(field.field_type) && field.choices) {
      setEditChoices(field.choices.length > 0 
        ? field.choices.map(c => ({ ...c })) 
        : [{ ...EMPTY_CHOICE }]
      )
    } else {
      setEditChoices([])
    }
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(EMPTY_FIELD)
    setEditChoices([])
    setError('')
  }

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleEditChoiceChange = (index, key, value) => {
    setEditChoices(prev => prev.map((c, i) => i === index ? { ...c, [key]: value } : c))
  }

  const addEditChoice = () => {
    setEditChoices(prev => [...prev, { ...EMPTY_CHOICE, order: prev.length }])
  }

  const removeEditChoice = (index) => {
    if (editChoices.length <= 1) return
    setEditChoices(prev => prev.filter((_, i) => i !== index))
  }

  const moveEditChoice = (index, dir) => {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= editChoices.length) return
    const arr = [...editChoices]
    ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
    arr.forEach((c, i) => c.order = i)
    setEditChoices(arr)
  }

  const saveEdit = () => {
    if (!editForm.label.trim()) {
      setError('Label is required.')
      return
    }

    // Choice validation
    if (CHOICE_FIELD_TYPES.includes(editForm.field_type)) {
      const valid = editChoices.filter(c => c.value.trim() && c.label.trim())
      if (valid.length < 2) {
        setError('At least 2 options are required.')
        return
      }
    }

    setSaving(true)
    setError('')

    const payload = {
      ...editForm,
      choices: CHOICE_FIELD_TYPES.includes(editForm.field_type)
        ? editChoices.filter(c => c.value.trim() && c.label.trim()).map((c, i) => ({ ...c, order: i }))
        : []
    }

    api.patch(`/categories/${slug}/fields/${editingId}/edit/`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => { loadFields(); cancelEdit() })
      .catch(err => {
        const data = err.response?.data
        setError(typeof data === 'string' ? data : JSON.stringify(data) || 'Error')
      })
      .finally(() => setSaving(false))
  }

  const deleteField = (field) => {
    if (!window.confirm(`"${field.label}" alanını silmek istediğinize emin misiniz?`)) return
    api.delete(`/categories/${slug}/fields/${field.id}/delete/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => loadFields())
  }

  // ─────────────────────────────────────────────────────────────
  // ADD
  // ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setShowAdd(true)
    setAddForm({ ...EMPTY_FIELD, order: fields.length })
    setAddChoices([{ ...EMPTY_CHOICE }])
    setError('')
  }

  const cancelAdd = () => {
    setShowAdd(false)
    setAddForm(EMPTY_FIELD)
    setAddChoices([])
    setError('')
  }

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target
    setAddForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))

    // Field type değişince choices'ı başlat/sıfırla
    if (name === 'field_type') {
      if (CHOICE_FIELD_TYPES.includes(value)) {
        setAddChoices([{ ...EMPTY_CHOICE }])
      } else {
        setAddChoices([])
      }
    }
  }

  const handleAddChoiceChange = (index, key, value) => {
    setAddChoices(prev => prev.map((c, i) => i === index ? { ...c, [key]: value } : c))
  }

  const addAddChoice = () => {
    setAddChoices(prev => [...prev, { ...EMPTY_CHOICE, order: prev.length }])
  }

  const removeAddChoice = (index) => {
    if (addChoices.length <= 1) return
    setAddChoices(prev => prev.filter((_, i) => i !== index))
  }

  const moveAddChoice = (index, dir) => {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= addChoices.length) return
    const arr = [...addChoices]
    ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
    arr.forEach((c, i) => c.order = i)
    setAddChoices(arr)
  }

  const saveAdd = () => {
    if (!addForm.name.trim() || !addForm.label.trim()) {
      setError('Name and Label are required.')
      return
    }

    // Choice validation
    if (CHOICE_FIELD_TYPES.includes(addForm.field_type)) {
      const valid = addChoices.filter(c => c.value.trim() && c.label.trim())
      if (valid.length < 2) {
        setError('At least 2 options are required.')
        return
      }
      const values = valid.map(c => c.value.trim().toLowerCase())
      if (new Set(values).size !== values.length) {
        setError('Option values must be unique.')
        return
      }
    }

    setSaving(true)
    setError('')

    const payload = {
      ...addForm,
      choices: CHOICE_FIELD_TYPES.includes(addForm.field_type)
        ? addChoices.filter(c => c.value.trim() && c.label.trim()).map((c, i) => ({ ...c, order: i }))
        : []
    }

    api.post(`/categories/${slug}/fields/add/`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => { loadFields(); cancelAdd() })
      .catch(err => {
        const data = err.response?.data
        setError(typeof data === 'string' ? data : Object.values(data).flat().join(' ') || 'Error')
      })
      .finally(() => setSaving(false))
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────
  const isChoiceField = (type) => CHOICE_FIELD_TYPES.includes(type)

  const renderChoicesEditor = (choices, onChange, onAdd, onRemove, onMove, disabled = false) => (
    <div className="field-choices-section">
      <div className="field-choices-header">
        <h4>Options</h4>
        <button type="button" className="field-btn-add-choice" onClick={onAdd}>
          + Add Option
        </button>
      </div>

      <div className="field-choices-list">
        {choices.map((choice, index) => (
          <div key={index} className="field-choice-row">
            <div className="field-choice-order">
              <button
                type="button"
                className="field-choice-move"
                onClick={() => onMove(index, -1)}
                disabled={index === 0}
              >↑</button>
              <button
                type="button"
                className="field-choice-move"
                onClick={() => onMove(index, 1)}
                disabled={index === choices.length - 1}
              >↓</button>
            </div>

            <input
              type="text"
              className="field-choice-value field-input"
              placeholder="value"
              value={choice.value}
              onChange={(e) => onChange(index, 'value', e.target.value)}
              disabled={disabled && choice.id}
            />

            <input
              type="text"
              className="field-choice-label field-input"
              placeholder="Label"
              value={choice.label}
              onChange={(e) => onChange(index, 'label', e.target.value)}
            />

            <input
              type="text"
              className="field-choice-icon field-input"
              placeholder="icon"
              value={choice.icon || ''}
              onChange={(e) => onChange(index, 'icon', e.target.value)}
            />

            <button
              type="button"
              className="field-choice-remove"
              onClick={() => onRemove(index)}
              disabled={choices.length <= 1}
            >✕</button>
          </div>
        ))}
      </div>

      <p className="field-choices-note">
        <strong>value:</strong> internal key (no spaces) &nbsp;|&nbsp;
        <strong>Label:</strong> shown to users
      </p>
    </div>
  )

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div>
      <Navbar />
      <main className="page-container">
        <div className="fields-box">

          <div className="fields-header">
            <h2>Field Definitions</h2>
            <span className="fields-slug">{slug}</span>
          </div>

          <div className="fields-actions">
            <button className="btn-secondary" onClick={() => navigate(`/category/${slug}`)}>
              ← Back to Category
            </button>
          </div>

          {/* FIELD LIST */}
          {loading ? (
            <p className="fields-empty">Loading...</p>
          ) : fields.length === 0 && !showAdd ? (
            <p className="fields-empty">No fields yet. Add your first field below.</p>
          ) : (
            <ul className="fields-list">
              {fields.map(field => (
                <li key={field.id} className="field-item">
                  {editingId === field.id ? (
                    /* EDIT MODE */
                    <div className="field-edit-form">
                      {error && <p className="field-error" style={{ color: '#c00', fontSize: 13 }}>{error}</p>}

                      <input
                        className="field-input"
                        name="label"
                        placeholder="Label"
                        value={editForm.label}
                        onChange={handleEditChange}
                      />

                      <input
                        className="field-input"
                        name="help_text"
                        placeholder="Help text (optional)"
                        value={editForm.help_text}
                        onChange={handleEditChange}
                      />

                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          className="field-input"
                          name="order"
                          type="number"
                          placeholder="Order"
                          value={editForm.order}
                          onChange={handleEditChange}
                          style={{ width: 80 }}
                        />
                        <select
                          className="field-select"
                          name="field_type"
                          value={editForm.field_type}
                          disabled
                        >
                          {FIELD_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="field-checkboxes">
                        <label>
                          <input
                            type="checkbox"
                            name="is_required"
                            checked={editForm.is_required}
                            onChange={handleEditChange}
                          /> Required
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            name="is_public"
                            checked={editForm.is_public}
                            onChange={handleEditChange}
                          /> Public
                        </label>
                      </div>

                      {/* CHOICES EDITOR */}
                      {isChoiceField(editForm.field_type) && renderChoicesEditor(
                        editChoices,
                        handleEditChoiceChange,
                        addEditChoice,
                        removeEditChoice,
                        moveEditChoice,
                        true // existing choices value disabled
                      )}

                      <div className="field-edit-btns">
                        <button className="btn-save" onClick={saveEdit} disabled={saving}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div className="field-row">
                      <div className="field-info">
                        <span className="field-label">{field.label}</span>
                        <span className="field-type-badge">
                          {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                        </span>
                        {isChoiceField(field.field_type) && field.choices_count > 0 && (
                          <span className="field-choices-count">({field.choices_count} options)</span>
                        )}
                        {field.is_required && <span className="field-badge required">required</span>}
                        {field.is_public && <span className="field-badge public">public</span>}
                        {field.help_text && <span className="field-help">{field.help_text}</span>}
                      </div>
                      <div className="field-btns">
                        <button className="btn-edit" onClick={() => startEdit(field)}>Edit</button>
                        <button className="btn-delete" onClick={() => deleteField(field)}>Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* ADD NEW FIELD */}
          {showAdd ? (
            <div className="field-edit-form" style={{ marginBottom: 24 }}>
              <h3 className="fields-add-title">Add New Field</h3>

              {error && <p style={{ color: '#c00', fontSize: 13 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="field-input"
                  name="name"
                  placeholder="Field name (e.g. wifi_speed)"
                  value={addForm.name}
                  onChange={handleAddChange}
                  style={{ flex: 1 }}
                />
                <select
                  className="field-select"
                  name="field_type"
                  value={addForm.field_type}
                  onChange={handleAddChange}
                  style={{ width: 160 }}
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <input
                className="field-input"
                name="label"
                placeholder="Display label (e.g. WiFi Speed)"
                value={addForm.label}
                onChange={handleAddChange}
              />

              <input
                className="field-input"
                name="help_text"
                placeholder="Help text (optional)"
                value={addForm.help_text}
                onChange={handleAddChange}
              />

              <input
                className="field-input"
                name="order"
                type="number"
                placeholder="Order"
                value={addForm.order}
                onChange={handleAddChange}
                style={{ width: 80 }}
              />

              <div className="field-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    name="is_required"
                    checked={addForm.is_required}
                    onChange={handleAddChange}
                  /> Required
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={addForm.is_public}
                    onChange={handleAddChange}
                  /> Public
                </label>
              </div>

              {/* CHOICES EDITOR FOR NEW FIELD */}
              {isChoiceField(addForm.field_type) && renderChoicesEditor(
                addChoices,
                handleAddChoiceChange,
                addAddChoice,
                removeAddChoice,
                moveAddChoice,
                false
              )}

              <div className="field-edit-btns">
                <button className="btn-save" onClick={saveAdd} disabled={saving}>
                  {saving ? 'Saving...' : 'Add Field'}
                </button>
                <button className="btn-cancel" onClick={cancelAdd}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn-edit" onClick={openAdd}>+ Add Field</button>
          )}

          {/* DONE */}
          <div className="fields-done">
            <button className="btn-save" onClick={() => navigate(`/category/${slug}`)}>
              Done → Go to Map
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default CategoryFieldsPage