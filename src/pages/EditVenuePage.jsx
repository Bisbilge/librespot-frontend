import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ContributePage.css'

function EditVenuePage() {
  const { categorySlug, venueSlug } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('access')

  const [venue, setVenue] = useState(null)
  const [fieldDefs, setFieldDefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', city: '', country: '', address: '',
    latitude: '', longitude: '', map_url: '',
  })
  const [activeFields, setActiveFields] = useState({})

  useEffect(function () {
    if (!token) { navigate('/login'); return }

    api.get('/venues/' + venueSlug + '/').then(function (res) {
      const v = res.data
      setVenue(v)
      setForm({
        name: v.name || '',
        city: v.city || '',
        country: v.country || '',
        address: v.address || '',
        latitude: v.latitude || '',
        longitude: v.longitude || '',
        map_url: v.map_url || '',
      })
      const fv = {}
      if (v.field_values) {
        v.field_values.forEach(function (f) { fv[f.field_name] = f.value })
      }
      setActiveFields(fv)
      if (v.category_slug) {
        api.get('/categories/' + v.category_slug + '/').then(function (res2) {
          setFieldDefs(res2.data.field_definitions || [])
        })
      }
      setLoading(false)
    }).catch(function () { setLoading(false) })
  }, [venueSlug])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(function (prev) { return Object.assign({}, prev, { [name]: value }) })
  }

  function handleFieldValue(fieldName, value) {
    setActiveFields(function (prev) { return Object.assign({}, prev, { [fieldName]: value }) })
  }

  function handleFieldAdd(def) {
    setActiveFields(function (prev) { return Object.assign({}, prev, { [def.name]: '' }) })
  }

  function handleFieldRemove(fieldName) {
    setActiveFields(function (prev) {
      const next = Object.assign({}, prev)
      delete next[fieldName]
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    api.post(
      '/contributions/venue/' + venue.id + '/edit/',
      {
        name: form.name,
        city: form.city,
        country: form.country,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        map_url: form.map_url,
        field_values: activeFields,
      },
      { headers: { Authorization: 'Bearer ' + token } }
    ).then(function () {
      setSuccess(true)
      setSaving(false)
    }).catch(function (err) {
      setError(JSON.stringify(err.response ? err.response.data : 'Error.'))
      setSaving(false)
    })
  }

  function renderFieldInput(fieldName, fieldDef) {
    const value = activeFields[fieldName] || ''
    const type = fieldDef ? fieldDef.field_type : 'string'
    if (type === 'boolean') return (
      <select className="filter-select" value={value}
        onChange={function (e) { handleFieldValue(fieldName, e.target.value) }}>
        <option value="">Select...</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    )
    if (type === 'text') return (
      <textarea className="report-textarea" value={value}
        onChange={function (e) { handleFieldValue(fieldName, e.target.value) }} />
    )
    if (type === 'integer' || type === 'decimal') return (
      <input type="number" value={value}
        onChange={function (e) { handleFieldValue(fieldName, e.target.value) }} />
    )
    if (type === 'url') return (
      <input type="url" value={value} placeholder="https://"
        onChange={function (e) { handleFieldValue(fieldName, e.target.value) }} />
    )
    return (
      <input type="text" value={value}
        onChange={function (e) { handleFieldValue(fieldName, e.target.value) }} />
    )
  }

  const availableToAdd = fieldDefs.filter(function (def) {
    return !activeFields.hasOwnProperty(def.name)
  })

  if (loading) return <div><Navbar /><div className="venue-loading">Loading...</div></div>

  if (success) return (
    <div>
      <Navbar />
      <main className="contribute-main">
        <div className="contribute-box">
          <h1>Thank you!</h1>
          <p>Your edit has been submitted and is pending review by a moderator.</p>
          <div className="contribute-actions">
            <Link to={`/venue/${categorySlug}/${venueSlug}`} className="auth-btn">Back to Venue</Link>
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div>
      <Navbar />
      <main className="contribute-main">
        <div className="contribute-box">
          <div className="venue-breadcrumb">
            <Link to={`/venue/${categorySlug}/${venueSlug}`}>← Back to {venue?.name}</Link>
          </div>

          <h1 className="contribute-title">Edit Venue</h1>
          <p className="contribute-desc">
            Your changes will be reviewed by a moderator before being published.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="contribute-form">
            <h2>Basic Information</h2>
            <div className="auth-field">
              <label>Venue Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label>City</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} />
              </div>
              <div className="auth-field">
                <label>Country</label>
                <input type="text" name="country" value={form.country} onChange={handleChange} />
              </div>
            </div>
            <div className="auth-field">
              <label>Address</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} />
            </div>

            <h2>Location</h2>
            <div className="auth-field">
              <label>Map URL</label>
              <input
                type="url"
                name="map_url"
                value={form.map_url}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div className="form-row">
              <div className="auth-field">
                <label>Latitude</label>
                <input type="text" name="latitude" value={form.latitude} onChange={handleChange} />
              </div>
              <div className="auth-field">
                <label>Longitude</label>
                <input type="text" name="longitude" value={form.longitude} onChange={handleChange} />
              </div>
            </div>

            {fieldDefs.length > 0 && (
              <div className="contribute-fields">
                <h2>Details</h2>
                {Object.keys(activeFields).length === 0 && (
                  <p className="contribute-desc" style={{ marginBottom: '0.75rem' }}>
                    No fields added yet.
                  </p>
                )}
                {Object.keys(activeFields).map(function (fieldName) {
                  const def = fieldDefs.find(function (d) { return d.name === fieldName })
                  const label = def ? def.label : fieldName
                  const helpText = def ? def.help_text : ''
                  const isRequired = def ? def.is_required : false
                  return (
                    <div key={fieldName} className="auth-field">
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{label}{isRequired && <span style={{ color: '#e53e3e' }}> *</span>}</span>
                        <button type="button" onClick={function () { handleFieldRemove(fieldName) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '0.8rem', fontWeight: 600 }}>
                          ✕ Remove
                        </button>
                      </label>
                      {helpText && <small style={{ color: '#718096', marginBottom: '4px', display: 'block' }}>{helpText}</small>}
                      {renderFieldInput(fieldName, def)}
                    </div>
                  )
                })}
                {availableToAdd.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#4a5568' }}>Add Fields</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {availableToAdd.map(function (def) {
                        return (
                          <button key={def.id} type="button" onClick={function () { handleFieldAdd(def) }}
                            style={{ padding: '0.35rem 0.85rem', borderRadius: '999px', border: '1.5px solid #667eea', background: 'white', color: '#667eea', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                            + {def.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Edit'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default EditVenuePage