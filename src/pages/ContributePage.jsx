import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ContributePage.css'

function ContributePage() {
  const token = localStorage.getItem('access')
  const [categories, setCategories] = useState([])
  const [fieldDefs, setFieldDefs] = useState([])
  const [fieldValues, setFieldValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    city: '',
    country: '',
    address: '',
    latitude: '',
    longitude: '',
    maps_url: '',
    category: '',
  })

  useEffect(function() {
    api.get('/categories/').then(function(res) {
      setCategories(res.data.results || res.data)
    })
  }, [])

  function handleChange(e) {
    const name = e.target.name
    const value = e.target.value
    setForm(function(prev) {
      return Object.assign({}, prev, { [name]: value })
    })
  }

  function handleCategoryChange(e) {
    const slug = e.target.value
    setForm(function(prev) {
      return Object.assign({}, prev, { category: slug })
    })
    setFieldValues({})
    if (slug) {
      api.get('/categories/' + slug + '/').then(function(res) {
        setFieldDefs(res.data.field_definitions || [])
      })
    } else {
      setFieldDefs([])
    }
  }

  function handleFieldValue(fieldName, value) {
    setFieldValues(function(prev) {
      return Object.assign({}, prev, { [fieldName]: value })
    })
  }

  function resetForm() {
    setSuccess(false)
    setError('')
    setFieldDefs([])
    setFieldValues({})
    setForm({
      name: '',
      city: '',
      country: '',
      address: '',
      latitude: '',
      longitude: '',
      maps_url: '',
      category: '',
    })
  }

  function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)
  setError('')

  const currentToken = localStorage.getItem('access')
  console.log('Token:', currentToken) // debug için

  const payload = {
    name: form.name,
    city: form.city,
    country: form.country,
    address: form.address,
    category: form.category,
    field_values: fieldValues,
  }

  if (form.latitude && form.longitude) {
    payload.latitude = form.latitude
    payload.longitude = form.longitude
  } else if (form.maps_url) {
    payload.maps_url = form.maps_url
  }

  api.post('/contributions/venue/', payload, {
    headers: { Authorization: 'Bearer ' + currentToken }
  }).then(function() {
    setSuccess(true)
    setLoading(false)
  }).catch(function(err) {
    setError(JSON.stringify(err.response ? err.response.data : 'An error occurred.'))
    setLoading(false)
  })
}

  if (!token) {
    return (
      <div>
        <Navbar />
        <main className="contribute-main">
          <div className="contribute-box">
            <h1>Contribute a Venue</h1>
            <p>You need to <Link to="/login">log in</Link> to contribute.</p>
          </div>
        </main>
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
            <p>Your contribution has been submitted and is pending review by a moderator.</p>
            <div className="contribute-actions">
              <Link to="/" className="auth-btn">Go to Home</Link>
              <button className="btn-clear" onClick={resetForm}>Add Another</button>
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
          <h1 className="contribute-title">Contribute a Venue</h1>
          <p className="contribute-desc">
            Your submission will be reviewed by a moderator before being published.
            All data is released under CC BY-SA 4.0.
          </p>

          {error && (
            <div className="auth-error">{error}</div>
          )}

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

            <div className="auth-field">
              <label>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleCategoryChange}
                required
                className="filter-select"
              >
                <option value="">Select a category...</option>
                {categories.map(function(cat) {
                  return (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  )
                })}
              </select>
            </div>

            <div className="form-row">
              <div className="auth-field">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                />
              </div>
              <div className="auth-field">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <h2>Location</h2>
            <p className="contribute-hint">Enter coordinates or paste a Google Maps link.</p>

            <div className="form-row">
              <div className="auth-field">
                <label>Latitude</label>
                <input
                  type="text"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="41.015137"
                />
              </div>
              <div className="auth-field">
                <label>Longitude</label>
                <input
                  type="text"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="28.979530"
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Or Google Maps URL</label>
              <input
                type="text"
                name="maps_url"
                value={form.maps_url}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
              />
            </div>

            {fieldDefs.length > 0 && (
              <div className="contribute-fields">
                <h2>Details</h2>
                {fieldDefs.map(function(field) {
                  return (
                    <div key={field.id} className="auth-field">
                      <label>
                        {field.label}
                        {field.is_required ? ' *' : ''}
                      </label>
                      {field.help_text ? (
                        <p className="contribute-hint">{field.help_text}</p>
                      ) : null}
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

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Contribution'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ContributePage