import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/EditVenuePage.css'

function EditVenuePage() {
  const { venueSlug } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('access')

  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Temel bilgi formu
  const [basicForm, setBasicForm] = useState({
    name: '', city: '', country: '', latitude: '', longitude: '',
  })
  const [basicSaving, setBasicSaving] = useState(false)
  const [basicSuccess, setBasicSuccess] = useState(false)
  const [basicError, setBasicError] = useState('')

  // Kategori alanları
  const [categorySections, setCategorySections] = useState([])

  const fetchVenue = useCallback(async () => {
    if (!token) { 
      navigate('/login')
      return 
    }

    try {
      const res = await api.get(`/venues/${venueSlug}/`)
      const v = res.data
      setVenue(v)
      
      setBasicForm({
        name: v.name || '',
        city: v.city || '',
        country: v.country || '',
        latitude: v.latitude || '',
        longitude: v.longitude || '',
      })

      const sections = []
      for (const cat of (v.categories || [])) {
        try {
          const catRes = await api.get(`/categories/${cat.category_slug}/`)
          const fieldDefs = catRes.data.field_definitions || []
          
          const fieldValues = {}
          cat.field_values?.forEach(fv => {
            fieldValues[fv.field_name] = fv.value
          })

          sections.push({
            slug: cat.category_slug,
            name: cat.category_name,
            fieldDefs,
            fieldValues,
            originalValues: { ...fieldValues },
            saving: false,
            success: false,
            error: '',
          })
        } catch (err) {
          console.error(`Failed to load category ${cat.category_slug}:`, err)
        }
      }
      setCategorySections(sections)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load venue:', err)
      setError('Could not load venue.')
      setLoading(false)
    }
  }, [venueSlug, token, navigate])

  useEffect(() => { fetchVenue() }, [fetchVenue])

  const handleBasicChange = (e) => {
    const { name, value } = e.target
    setBasicForm(prev => ({ ...prev, [name]: value }))
    setBasicSuccess(false)
  }

  // Backend'den gelen karmaşık hataları düzgün string'e çeviren yardımcı fonksiyon
  const formatError = (err) => {
    if (err.response?.data) {
      if (typeof err.response.data.detail === 'string') return err.response.data.detail;
      // Eğer { name: ["Zorunlu alan"] } gibi bir obje geliyorsa
      return JSON.stringify(err.response.data).replace(/["{}\[\]]/g, ' ');
    }
    return 'Could not save changes. Please try again.';
  }

  // Temel bilgileri gönder
  const handleBasicSubmit = async (e) => {
    e.preventDefault()
    setBasicSaving(true)
    setBasicError('')
    setBasicSuccess(false)

    const firstCat = categorySections[0]?.slug || ''

    try {
      await api.post(
        `/contributions/venue/${venue.id}/edit/`,
        {
          name: basicForm.name,
          city: basicForm.city,
          country: basicForm.country,
          latitude: basicForm.latitude,
          longitude: basicForm.longitude,
          category: firstCat,
          field_values: {},
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBasicSuccess(true)
    } catch (err) {
      console.error("Submit Basic Error:", err)
      setBasicError(formatError(err))
    } finally {
      setBasicSaving(false)
    }
  }

  const handleCategoryFieldChange = (catSlug, fieldName, value) => {
    setCategorySections(prev => prev.map(sec => {
      if (sec.slug !== catSlug) return sec
      return {
        ...sec,
        fieldValues: { ...sec.fieldValues, [fieldName]: value },
        success: false,
      }
    }))
  }

  const handleAddField = (catSlug, fieldDef) => {
    setCategorySections(prev => prev.map(sec => {
      if (sec.slug !== catSlug) return sec
      return {
        ...sec,
        fieldValues: { ...sec.fieldValues, [fieldDef.name]: '' },
        success: false,
      }
    }))
  }

  const handleRemoveField = (catSlug, fieldName) => {
    setCategorySections(prev => prev.map(sec => {
      if (sec.slug !== catSlug) return sec
      const newValues = { ...sec.fieldValues }
      delete newValues[fieldName]
      return {
        ...sec,
        fieldValues: newValues,
        success: false,
      }
    }))
  }

  // Kategori bilgilerini gönder
  const handleCategorySubmit = async (catSlug) => {
    const section = categorySections.find(s => s.slug === catSlug)
    if (!section) return

    setCategorySections(prev => prev.map(sec => 
      sec.slug === catSlug ? { ...sec, saving: true, error: '', success: false } : sec
    ))

    try {
      await api.post(
        `/contributions/venue/${venue.id}/edit/`,
        {
          name: basicForm.name, // Orijinal venue.name yerine formdaki son halini alıyoruz
          city: basicForm.city,
          country: basicForm.country,
          latitude: basicForm.latitude,
          longitude: basicForm.longitude,
          category: catSlug,
          field_values: section.fieldValues,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setCategorySections(prev => prev.map(sec => 
        sec.slug === catSlug 
          ? { ...sec, saving: false, success: true, originalValues: { ...sec.fieldValues } } 
          : sec
      ))
    } catch (err) {
      console.error("Submit Category Error:", err)
      setCategorySections(prev => prev.map(sec => 
        sec.slug === catSlug 
          ? { ...sec, saving: false, error: formatError(err) } 
          : sec
      ))
    }
  }

  // Alanın tipine göre uygun input render etme
  const renderFieldInput = (fieldDef, value, onChange) => {
    const type = fieldDef?.field_type || 'string'
    
    // YENİ EKLENEN DROPDOWN DESTEĞİ
    if (type === 'dropdown') {
      // Backend'den virgülle ayrılmış gelen string'i diziye çeviriyoruz
      const choices = fieldDef.choices ? fieldDef.choices.split(',').map(c => c.trim()) : []
      return (
        <select 
          className="field-input"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Select an option...</option>
          {choices.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )
    }
    
    if (type === 'boolean') {
      return (
        <div className="field-boolean-group">
          <label className={`field-boolean-option ${value === 'true' ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`field-${fieldDef.name}`}
              checked={value === 'true'}
              onChange={() => onChange('true')}
            />
            <span className="bool-label yes">Yes</span>
          </label>
          <label className={`field-boolean-option ${value === 'false' ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`field-${fieldDef.name}`}
              checked={value === 'false'}
              onChange={() => onChange('false')}
            />
            <span className="bool-label no">No</span>
          </label>
          <label className={`field-boolean-option ${value === '' || value === undefined ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`field-${fieldDef.name}`}
              checked={value === '' || value === undefined}
              onChange={() => onChange('')}
            />
            <span className="bool-label unknown">Unknown</span>
          </label>
        </div>
      )
    }
    
    if (type === 'text') {
      return (
        <textarea 
          className="field-textarea" 
          value={value || ''}
          onChange={e => onChange(e.target.value)} 
        />
      )
    }
    
    if (type === 'integer' || type === 'decimal' || type === 'number') {
      return (
        <input 
          type="number" 
          className="field-input"
          value={value || ''}
          onChange={e => onChange(e.target.value)} 
        />
      )
    }
    
    if (type === 'url') {
      return (
        <input 
          type="url" 
          className="field-input"
          value={value || ''} 
          placeholder="https://..."
          onChange={e => onChange(e.target.value)} 
        />
      )
    }
    
    return (
      <input 
        type="text" 
        className="field-input"
        value={value || ''}
        onChange={e => onChange(e.target.value)} 
      />
    )
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="venue-loading">Loading…</div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div>
        <Navbar />
        <div className="venue-loading">
          <h2>Error</h2>
          <p>{error || 'Venue not found.'}</p>
          <Link to="/" className="btn-secondary">Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <main className="edit-venue-page">
        <div className="edit-venue-box">
          <nav className="venue-breadcrumb">
            <Link to="/">Mapedia</Link>
            <span className="venue-breadcrumb-sep">›</span>
            <Link to={`/venue/${venueSlug}`}>{venue.name}</Link>
            <span className="venue-breadcrumb-sep">›</span>
            <span>Edit</span>
          </nav>

          <h1 className="edit-venue-title">Edit {venue.name}</h1>
          <p className="edit-venue-desc">
            Changes will be reviewed by a moderator before being published.
          </p>

          {/* BASIC INFORMATION SECTION */}
          <section className="edit-section">
            <h2 className="edit-section-title">Basic Information</h2>
            <p className="edit-section-desc">
              General information about this venue.
            </p>

            <form onSubmit={handleBasicSubmit} className="edit-form">
              <div className="edit-field">
                <label>Venue Name <span className="required">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={basicForm.name} 
                  onChange={handleBasicChange} 
                  required 
                  className="field-input"
                />
              </div>

              <div className="edit-field-row">
                <div className="edit-field">
                  <label>City</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={basicForm.city} 
                    onChange={handleBasicChange}
                    className="field-input"
                  />
                </div>
                <div className="edit-field">
                  <label>Country</label>
                  <input 
                    type="text" 
                    name="country" 
                    value={basicForm.country} 
                    onChange={handleBasicChange}
                    className="field-input"
                  />
                </div>
              </div>

              <div className="edit-field-row">
                <div className="edit-field">
                  <label>Latitude</label>
                  <input 
                    type="text" 
                    name="latitude" 
                    value={basicForm.latitude} 
                    onChange={handleBasicChange}
                    className="field-input"
                    placeholder="e.g. 41.0082"
                  />
                </div>
                <div className="edit-field">
                  <label>Longitude</label>
                  <input 
                    type="text" 
                    name="longitude" 
                    value={basicForm.longitude} 
                    onChange={handleBasicChange}
                    className="field-input"
                    placeholder="e.g. 28.9784"
                  />
                </div>
              </div>

              {basicError && <p className="edit-error">{basicError}</p>}
              {basicSuccess && <p className="edit-success">✓ Changes submitted for review.</p>}

              <div className="edit-actions">
                <button type="submit" className="btn-primary" disabled={basicSaving}>
                  {basicSaving ? 'Saving…' : 'Save Basic Info'}
                </button>
              </div>
            </form>
          </section>

          {/* CATEGORY-SPECIFIC FIELDS SECTION */}
          {categorySections.map(section => {
            const availableFields = section.fieldDefs.filter(
              def => !section.fieldValues.hasOwnProperty(def.name)
            )
            
            return (
              <section key={section.slug} className="edit-section">
                <h2 className="edit-section-title">
                  <Link to={`/category/${section.slug}`} className="category-link">
                    {section.name}
                  </Link>
                </h2>
                <p className="edit-section-desc">
                  Fields specific to the {section.name} category.
                </p>

                {section.fieldDefs.length === 0 ? (
                  <p className="no-fields-message">
                    This category doesn't have any custom fields.
                  </p>
                ) : (
                  <div className="edit-form">
                    {/* Active fields */}
                    {Object.keys(section.fieldValues).map(fieldName => {
                      const def = section.fieldDefs.find(d => d.name === fieldName)
                      if (!def) return null
                      
                      return (
                        <div key={fieldName} className="edit-field">
                          <label className="field-label-with-remove">
                            <span>
                              {def.label}
                              {def.is_required && <span className="required">*</span>}
                            </span>
                            <button 
                              type="button" 
                              className="btn-remove-field"
                              onClick={() => handleRemoveField(section.slug, fieldName)}
                            >
                              ✕ Remove
                            </button>
                          </label>
                          {def.help_text && (
                            <small className="field-help">{def.help_text}</small>
                          )}
                          {renderFieldInput(
                            def, 
                            section.fieldValues[fieldName],
                            (value) => handleCategoryFieldChange(section.slug, fieldName, value)
                          )}
                        </div>
                      )
                    })}

                    {/* Add more fields */}
                    {availableFields.length > 0 && (
                      <div className="add-fields-section">
                        <p className="add-fields-label">Add more fields:</p>
                        <div className="add-fields-buttons">
                          {availableFields.map(def => (
                            <button 
                              key={def.name} 
                              type="button" 
                              className="btn-add-field"
                              onClick={() => handleAddField(section.slug, def)}
                            >
                              + {def.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.error && <p className="edit-error">{section.error}</p>}
                    {section.success && <p className="edit-success">✓ Changes submitted for review.</p>}

                    <div className="edit-actions">
                      <button 
                        type="button" 
                        className="btn-primary"
                        disabled={section.saving}
                        onClick={() => handleCategorySubmit(section.slug)}
                      >
                        {section.saving ? 'Saving…' : `Save ${section.name} Fields`}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )
          })}

          <section className="edit-section add-category-section">
            <h2 className="edit-section-title">Add to Another Category</h2>
            <p className="edit-section-desc">
              This venue can belong to multiple categories. Add it to another category to make it more discoverable.
            </p>
            <button 
              className="btn-secondary"
              onClick={() => navigate(`/venue/${venueSlug}/add-category`)}
            >
              + Add Category
            </button>
          </section>

          <div className="edit-footer">
            <Link to={`/venue/${venueSlug}`} className="btn-back">
              ← Back to {venue.name}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default EditVenuePage