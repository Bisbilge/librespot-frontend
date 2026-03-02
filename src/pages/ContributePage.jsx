import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ContributePage.css'

function ContributePage() {
  const token = localStorage.getItem('access')
  const [searchParams] = useSearchParams()
  const preselectedCategory = searchParams.get('category') || ''

  // Category search state
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryResults, setCategoryResults] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const categorySearchRef = useRef(null)

  // Field definitions and values
  const [fieldDefs, setFieldDefs] = useState([])
  const [fieldValues, setFieldValues] = useState({})

  // Form state
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
    map_url: '',
  })

  // Load preselected category if provided
  useEffect(() => {
    if (preselectedCategory) {
      setCategoryLoading(true)
      api.get(`/categories/${preselectedCategory}/`)
        .then((res) => {
          const cat = res.data
          setSelectedCategory({
            slug: cat.slug,
            name: cat.name,
          })
          setCategorySearch(cat.name)
          setFieldDefs(cat.field_definitions || [])
        })
        .catch((err) => {
          console.error("Failed to load category:", err)
        })
        .finally(() => {
          setCategoryLoading(false)
        })
    }
  }, [preselectedCategory])

  // Category search
  useEffect(() => {
    if (selectedCategory) return
    if (categorySearch.length < 2) {
      setCategoryResults([])
      return
    }

    const timer = setTimeout(() => {
      api.get(`/categories/?search=${encodeURIComponent(categorySearch)}`)
        .then((res) => {
          setCategoryResults(res.data.results || res.data)
        })
        .catch(() => {
          setCategoryResults([])
        })
    }, 300)

    return () => clearTimeout(timer)
  }, [categorySearch, selectedCategory])

  // Handle category selection
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat)
    setCategorySearch(cat.name)
    setCategoryResults([])
    setFieldValues({})

    api.get(`/categories/${cat.slug}/`)
      .then((res) => {
        setFieldDefs(res.data.field_definitions || [])
      })
      .catch(() => {
        setFieldDefs([])
      })
  }

  // Clear category selection
  const handleClearCategory = () => {
    setSelectedCategory(null)
    setCategorySearch('')
    setFieldDefs([])
    setFieldValues({})
  }

  // Form handlers
  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleFieldValue(fieldName, value) {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  // Multi-choice toggle handler
  function handleMultiChoiceToggle(fieldName, choiceValue) {
    setFieldValues((prev) => {
      const current = prev[fieldName] || []
      const arr = Array.isArray(current) ? current : []
      
      if (arr.includes(choiceValue)) {
        // Remove
        return { ...prev, [fieldName]: arr.filter(v => v !== choiceValue) }
      } else {
        // Add
        return { ...prev, [fieldName]: [...arr, choiceValue] }
      }
    })
  }

  function resetForm() {
    setSuccess(false)
    setError('')
    setFieldValues({})
    setForm({
      name: '',
      city: '',
      country: '',
      address: '',
      latitude: '',
      longitude: '',
      map_url: '',
    })
    if (!preselectedCategory) {
      handleClearCategory()
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    if (!selectedCategory) {
      setError('Please select a category.')
      return
    }

    setLoading(true)
    setError('')

    const currentToken = localStorage.getItem('access')

    // Prepare field values - convert multi_choice arrays to JSON
    const processedFieldValues = {}
    for (const [key, value] of Object.entries(fieldValues)) {
      if (Array.isArray(value)) {
        processedFieldValues[key] = JSON.stringify(value)
      } else {
        processedFieldValues[key] = value
      }
    }

    const payload = {
      name: form.name,
      city: form.city,
      country: form.country,
      address: form.address,
      category: selectedCategory.slug,
      latitude: form.latitude || '',
      longitude: form.longitude || '',
      map_url: form.map_url || '',
      field_values: processedFieldValues,
    }

    api.post('/contributions/venue/', payload, {
      headers: { Authorization: `Bearer ${currentToken}` }
    }).then(() => {
      setSuccess(true)
      setLoading(false)
    }).catch((err) => {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'An error occurred.')
      setLoading(false)
    })
  }

  // Render field input based on type
  function renderFieldInput(field) {
    const value = fieldValues[field.name]

    // ─────────────────────────────────────────────────────────────
    // BOOLEAN
    // ─────────────────────────────────────────────────────────────
    if (field.field_type === 'boolean') {
      const boolValue = value || ''
      return (
        <div className="field-boolean-group">
          <label className={`field-boolean-option ${boolValue === 'true' ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`field-${field.name}`}
              checked={boolValue === 'true'}
              onChange={() => handleFieldValue(field.name, 'true')}
            />
            <span className="bool-label yes">Yes</span>
          </label>
          <label className={`field-boolean-option ${boolValue === 'false' ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`field-${field.name}`}
              checked={boolValue === 'false'}
              onChange={() => handleFieldValue(field.name, 'false')}
            />
            <span className="bool-label no">No</span>
          </label>
          <label className={`field-boolean-option ${boolValue === '' ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`field-${field.name}`}
              checked={boolValue === ''}
              onChange={() => handleFieldValue(field.name, '')}
            />
            <span className="bool-label unknown">Unknown</span>
          </label>
        </div>
      )
    }

    // ─────────────────────────────────────────────────────────────
    // SINGLE CHOICE (Dropdown or Radio)
    // ─────────────────────────────────────────────────────────────
    if (field.field_type === 'choice') {
      const choices = field.choices || []
      const selectedValue = value || ''

      // If few choices, show as radio buttons
      if (choices.length <= 5) {
        return (
          <div className="field-choice-group">
            {choices.map((choice) => (
              <label 
                key={choice.value} 
                className={`field-choice-option ${selectedValue === choice.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`field-${field.name}`}
                  value={choice.value}
                  checked={selectedValue === choice.value}
                  onChange={() => handleFieldValue(field.name, choice.value)}
                />
                {choice.icon && <span className="choice-icon">{choice.icon}</span>}
                <span className="choice-label">{choice.label}</span>
              </label>
            ))}
            {/* Clear option if not required */}
            {!field.is_required && selectedValue && (
              <button 
                type="button" 
                className="field-choice-clear"
                onClick={() => handleFieldValue(field.name, '')}
              >
                Clear
              </button>
            )}
          </div>
        )
      }

      // More choices: show as dropdown
      return (
        <select
          className="field-select"
          value={selectedValue}
          onChange={(e) => handleFieldValue(field.name, e.target.value)}
          required={field.is_required}
        >
          <option value="">-- Select --</option>
          {choices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      )
    }

    // ─────────────────────────────────────────────────────────────
    // MULTIPLE CHOICE (Checkboxes)
    // ─────────────────────────────────────────────────────────────
    if (field.field_type === 'multi_choice') {
      const choices = field.choices || []
      const selectedValues = Array.isArray(value) ? value : []

      return (
        <div className="field-multichoice-group">
          {choices.map((choice) => (
            <label 
              key={choice.value} 
              className={`field-multichoice-option ${selectedValues.includes(choice.value) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                value={choice.value}
                checked={selectedValues.includes(choice.value)}
                onChange={() => handleMultiChoiceToggle(field.name, choice.value)}
              />
              {choice.icon && <span className="choice-icon">{choice.icon}</span>}
              <span className="choice-label">{choice.label}</span>
            </label>
          ))}
          {selectedValues.length > 0 && (
            <div className="field-multichoice-summary">
              {selectedValues.length} selected
            </div>
          )}
        </div>
      )
    }

    // ─────────────────────────────────────────────────────────────
    // TEXT (Long)
    // ─────────────────────────────────────────────────────────────
    if (field.field_type === 'text') {
      return (
        <textarea
          className="field-textarea"
          value={value || ''}
          onChange={(e) => handleFieldValue(field.name, e.target.value)}
          required={field.is_required}
        />
      )
    }

    // ─────────────────────────────────────────────────────────────
    // NUMBER (Integer / Decimal)
    // ─────────────────────────────────────────────────────────────
    if (field.field_type === 'integer' || field.field_type === 'decimal' || field.field_type === 'number') {
      return (
        <input
          type="number"
          className="field-input"
          value={value || ''}
          onChange={(e) => handleFieldValue(field.name, e.target.value)}
          required={field.is_required}
          step={field.field_type === 'decimal' ? '0.01' : '1'}
        />
      )
    }

    // ─────────────────────────────────────────────────────────────
    // URL
    // ─────────────────────────────────────────────────────────────
    if (field.field_type === 'url') {
      return (
        <input
          type="url"
          className="field-input"
          value={value || ''}
          placeholder="https://..."
          onChange={(e) => handleFieldValue(field.name, e.target.value)}
          required={field.is_required}
        />
      )
    }

    // ─────────────────────────────────────────────────────────────
    // DEFAULT: String (Short Text)
    // ─────────────────────────────────────────────────────────────
    return (
      <input
        type="text"
        className="field-input"
        value={value || ''}
        onChange={(e) => handleFieldValue(field.name, e.target.value)}
        required={field.is_required}
      />
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // NOT LOGGED IN
  // ═══════════════════════════════════════════════════════════════
  if (!token) {
    return (
      <div>
        <Navbar />
        <main className="contribute-main">
          <div className="contribute-box">
            <h1 className="contribute-title">Contribute a Venue</h1>
            <p>You need to <Link to="/login">log in</Link> to contribute.</p>
          </div>
        </main>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SUCCESS STATE
  // ═══════════════════════════════════════════════════════════════
  if (success) {
    return (
      <div>
        <Navbar />
        <main className="contribute-main">
          <div className="contribute-box">
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h2>Thank You!</h2>
              <p>Your contribution has been submitted and is pending review by a moderator.</p>
              <div className="success-actions">
                {selectedCategory && (
                  <Link to={`/category/${selectedCategory.slug}`} className="btn-primary">
                    Back to {selectedCategory.name}
                  </Link>
                )}
                <button className="btn-secondary" onClick={resetForm}>
                  Add Another Venue
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN FORM
  // ═══════════════════════════════════════════════════════════════
  return (
    <div>
      <Navbar />
      <main className="contribute-main">
        <div className="contribute-box">
          <h1 className="contribute-title">Contribute a Venue</h1>
          <p className="contribute-desc">
            Your submission will be reviewed by a moderator before being published.
            All data is released under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.
          </p>

          {error && <div className="contribute-error">{error}</div>}

          <form onSubmit={handleSubmit} className="contribute-form">
            
            {/* ══════════════════════════════════════════════════════════════
                CATEGORY SELECTION
                ══════════════════════════════════════════════════════════════ */}
            <h2>Category</h2>
            
            <div className="auth-field" ref={categorySearchRef} style={{ position: 'relative' }}>
              <label>Select Category <span className="required">*</span></label>
              <div className="category-search-wrap">
                <input
                  type="text"
                  placeholder="Search for a category..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  disabled={!!selectedCategory}
                  className={selectedCategory ? 'input-selected' : ''}
                  autoComplete="off"
                />
                {selectedCategory && (
                  <button 
                    type="button" 
                    className="category-clear-btn" 
                    onClick={handleClearCategory}
                    title="Change category"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {!selectedCategory && categoryResults.length > 0 && (
                <ul className="category-suggestions">
                  {categoryResults.map((cat) => (
                    <li
                      key={cat.slug}
                      className="category-suggestion-item"
                      onMouseDown={() => handleSelectCategory(cat)}
                    >
                      <span className="suggestion-name">{cat.name}</span>
                      {cat.venue_count !== undefined && (
                        <span className="suggestion-count">{cat.venue_count} venues</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              
              {!selectedCategory && categorySearch.length >= 2 && categoryResults.length === 0 && !categoryLoading && (
                <p className="category-no-results">No categories found.</p>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                BASIC INFORMATION
                ══════════════════════════════════════════════════════════════ */}
            <h2>Basic Information</h2>

            <div className="auth-field">
              <label>Venue Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                className="field-input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="auth-field">
                <label>City</label>
                <input 
                  type="text" 
                  name="city" 
                  className="field-input"
                  value={form.city} 
                  onChange={handleChange} 
                />
              </div>
              <div className="auth-field">
                <label>Country</label>
                <input 
                  type="text" 
                  name="country" 
                  className="field-input"
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
                className="field-input"
                value={form.address} 
                onChange={handleChange} 
              />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                LOCATION
                ══════════════════════════════════════════════════════════════ */}
            <h2>Location</h2>
            <p className="contribute-hint">Enter coordinates or paste a Google Maps link.</p>

            <div className="auth-field">
              <label>Google Maps URL</label>
              <input
                type="text"
                name="map_url"
                className="field-input"
                value={form.map_url}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="form-row">
              <div className="auth-field">
                <label>Latitude</label>
                <input
                  type="text"
                  name="latitude"
                  className="field-input"
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
                  className="field-input"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="28.979530"
                />
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                CATEGORY-SPECIFIC FIELDS
                ══════════════════════════════════════════════════════════════ */}
            {selectedCategory && fieldDefs.length > 0 && (
              <div className="contribute-fields">
                <h2>{selectedCategory.name} Details</h2>
                {fieldDefs.map((field) => (
                  <div key={field.id} className="auth-field">
                    <label>
                      {field.label}
                      {field.is_required && <span className="required">*</span>}
                    </label>
                    {field.help_text && (
                      <small className="field-help">{field.help_text}</small>
                    )}
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
            )}

            {selectedCategory && fieldDefs.length === 0 && (
              <p className="no-fields-hint">
                This category doesn't have any additional fields.
              </p>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SUBMIT
                ══════════════════════════════════════════════════════════════ */}
            <div className="contribute-actions">
              <button type="submit" className="btn-primary" disabled={loading || !selectedCategory}>
                {loading ? 'Submitting...' : 'Submit Contribution'}
              </button>
            </div>

            <p className="contribute-footer-hint">
              Your contribution will be reviewed by a moderator before being published.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ContributePage