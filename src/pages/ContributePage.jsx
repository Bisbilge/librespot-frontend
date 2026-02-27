import { useState, useEffect } from 'react'
import { Link, useSearchParams, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ContributePage.css'

function ContributePage() {
  const token = localStorage.getItem('access')
  const [searchParams] = useSearchParams()
  const preselectedCategory = searchParams.get('category') || ''

  // Kategorinin okunabilir adını bulmak için state
  const [categoryName, setCategoryName] = useState(preselectedCategory) 
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
    category: preselectedCategory,
  })

  // URL'den gelen kategori bilgisiyle hem detayları hem de alanları (fields) çek
  useEffect(() => {
    if (preselectedCategory) {
      api.get(`/categories/${preselectedCategory}/`).then((res) => {
        setFieldDefs(res.data.field_definitions || [])
        // Kategorinin güzel adını (Label) formda göstermek için kaydediyoruz
        if (res.data.name) {
          setCategoryName(res.data.name)
        }
      }).catch((err) => {
        console.error("Kategori yüklenirken hata oluştu:", err)
      })
    }
  }, [preselectedCategory])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleFieldValue(fieldName, value) {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  function resetForm() {
    setSuccess(false)
    setError('')
    // DİKKAT: setFieldDefs([]) yapmıyoruz ki "Add Another" dendiğinde 
    // Free Toilets'a ait özel alanlar ekranda kalmaya devam etsin.
    setFieldValues({})
    setForm({
      name: '',
      city: '',
      country: '',
      address: '',
      latitude: '',
      longitude: '',
      maps_url: '',
      category: preselectedCategory, // Kategoriyi sabit tutuyoruz
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const currentToken = localStorage.getItem('access')

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
      headers: { Authorization: `Bearer ${currentToken}` }
    }).then(() => {
      setSuccess(true)
      setLoading(false)
    }).catch((err) => {
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

  // Eğer URL'de kategori yoksa kullanıcıyı ana sayfaya veya kategori seçimine geri gönder
  if (!preselectedCategory) {
    return <Navigate to="/" replace />
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
              <Link to={`/category/${preselectedCategory}`} className="auth-btn">Back to Category</Link>
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

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="contribute-form">
            <h2>Basic Information</h2>

            <div className="auth-field">
              <label>Category</label>
              {/* Kategori artık değiştirilemez, sadece okunabilir bir bilgi olarak gösteriliyor */}
              <input
                type="text"
                value={categoryName}
                disabled
                className="disabled-input"
                style={{ backgroundColor: 'var(--bg-light)', color: 'var(--text-light)', cursor: 'not-allowed' }}
              />
            </div>

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
                {fieldDefs.map((field) => (
                  <div key={field.id} className="auth-field">
                    <label>
                      {field.label}{field.is_required ? ' *' : ''}
                    </label>
                    {field.help_text && (
                      <p className="contribute-hint">{field.help_text}</p>
                    )}
                    {field.field_type === 'boolean' ? (
                      <select
                        className="filter-select"
                        value={fieldValues[field.name] || ''}
                        onChange={(e) => handleFieldValue(field.name, e.target.value)}
                        required={field.is_required}
                      >
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : field.field_type === 'text' ? (
                      <textarea
                        className="report-textarea"
                        value={fieldValues[field.name] || ''}
                        onChange={(e) => handleFieldValue(field.name, e.target.value)}
                        required={field.is_required}
                      />
                    ) : (
                      <input
                        type="text"
                        value={fieldValues[field.name] || ''}
                        onChange={(e) => handleFieldValue(field.name, e.target.value)}
                        required={field.is_required}
                      />
                    )}
                  </div>
                ))}
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