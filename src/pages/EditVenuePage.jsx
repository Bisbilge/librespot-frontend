import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ContributePage.css'

function EditVenuePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('access')
  const [venue, setVenue] = useState(null)
  const [fieldDefs, setFieldDefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    city: '',
    country: '',
    address: '',
    latitude: '',
    longitude: '',
  })
  const [fieldValues, setFieldValues] = useState({})

  useEffect(function() {
    if (!token) {
      navigate('/login')
      return
    }
    api.get('/venues/' + id + '/').then(function(res) {
      const v = res.data
      setVenue(v)
      setForm({
        name: v.name || '',
        city: v.city || '',
        country: v.country || '',
        address: v.address || '',
        latitude: v.latitude || '',
        longitude: v.longitude || '',
      })
      const fv = {}
      if (v.field_values) {
        v.field_values.forEach(function(f) {
          fv[f.field_name || f.field_label] = f.value
        })
      }
      setFieldValues(fv)
      if (v.category) {
        api.get('/categories/' + v.category + '/').then(function(res2) {
          setFieldDefs(res2.data.field_definitions || [])
        })
      }
      setLoading(false)
    })
  }, [id])

  function handleChange(e) {
    const name = e.target.name
    const value = e.target.value
    setForm(function(prev) {
      return Object.assign({}, prev, { [name]: value })
    })
  }

  function handleFieldValue(fieldName, value) {
    setFieldValues(function(prev) {
      return Object.assign({}, prev, { [fieldName]: value })
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    api.post('/contributions/venue/' + id + '/edit/', {
      name: form.name,
      city: form.city,
      country: form.country,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      field_values: fieldValues,
    }, {
      headers: { Authorization: 'Bearer ' + token }
    }).then(function() {
      setSuccess(true)
      setSaving(false)
    }).catch(function(err) {
      setError(JSON.stringify(err.response ? err.response.data : 'Error.'))
      setSaving(false)
    })
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="venue-loading">Loading...</div>
      </div>
    )
  }

  if (success) {
    return (
      <div>
        <Navbar />
        <main className="contribute-main">
          <div className="contribute-box">
            <h1>Thank you!</h1>
            <p>Your edit has been submitted and is pending review by a moderator.</p>
            <div className="contribute-actions">
              <Link to={'/venue/' + id} className="auth-btn">Back to Venue</Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <main className="contribute-main">
        <div className="contribute-box">
          <div className="venue-breadcrumb">
            <Link to={'/venue/' + id}>Back to {venue.name}</Link>
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
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
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
                {fieldDefs.map(function(field) {
                  return (
                    <div key={field.id} className="auth-field">
                      <label>{field.label}</label>
                      {field.field_type === 'boolean' ? (
                        <select
                          className="filter-select"
                          value={fieldValues[field.name] || ''}
                          onChange={function(e) { handleFieldValue(field.name, e.target.value) }}
                        >
                          <option value="">Select...</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : field.field_type === 'text' ? (
                        <textarea
                          className="report-textarea"
                          value={fieldValues[field.name] || ''}
                          onChange={function(e) { handleFieldValue(field.name, e.target.value) }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={fieldValues[field.name] || ''}
                          onChange={function(e) { handleFieldValue(field.name, e.target.value) }}
                        />
                      )}
                    </div>
                  )
                })}
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