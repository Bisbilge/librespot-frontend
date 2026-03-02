import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/AddCategoryPage.css'

function AddCategoryPage() {
  const { venueSlug } = useParams()
  const navigate = useNavigate()
  
  // Venue state
  const [venue, setVenue] = useState(null)
  const [venueLoading, setVenueLoading] = useState(true)
  
  // Category search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Selected category state
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryFields, setCategoryFields] = useState([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  
  // Field values state
  const [fieldValues, setFieldValues] = useState({})
  
  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Fetch venue info
  const fetchVenue = useCallback(async () => {
    try {
      const res = await api.get(`/venues/${venueSlug}/`)
      setVenue(res.data)
    } catch (err) {
      console.error('Failed to fetch venue:', err)
    } finally {
      setVenueLoading(false)
    }
  }, [venueSlug])

  useEffect(() => { fetchVenue() }, [fetchVenue])

  // Search categories
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(() => {
      setSearchLoading(true)
      api.get(`/categories/?search=${encodeURIComponent(query)}`)
        .then(res => {
          const categories = res.data.results || res.data
          // Filter out categories the venue already has
          const existingSlugs = venue?.categories?.map(c => c.category_slug) || []
          const filtered = categories.filter(cat => !existingSlugs.includes(cat.slug))
          setResults(filtered)
        })
        .catch(() => {})
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query, venue])

  // Fetch category fields when a category is selected
  const handleSelectCategory = async (category) => {
    setSelectedCategory(category)
    setFieldValues({})
    setError('')
    setFieldsLoading(true)
    
    try {
      const res = await api.get(`/categories/${category.slug}/fields/`)
      const fields = res.data.results || res.data
      setCategoryFields(fields)
      
      // Initialize field values with empty strings
      const initialValues = {}
      fields.forEach(field => {
        initialValues[field.name] = ''  // Use field.name as key (backend expects field names)
      })
      setFieldValues(initialValues)
    } catch (err) {
      console.error('Failed to fetch fields:', err)
      setError('Could not load category fields.')
      setCategoryFields([])
    } finally {
      setFieldsLoading(false)
    }
  }

  // Handle field value change - use field.name as key
  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  // Submit contribution
  const handleSubmit = async () => {
    if (!selectedCategory || !venue) return
    
    setSubmitting(true)
    setError('')
    
    try {
      // Build field_values object for the API (backend expects { field_name: value } format)
      const fieldValuesObj = {}
      Object.entries(fieldValues).forEach(([fieldName, value]) => {
        if (value !== '' && value !== null) {
          fieldValuesObj[fieldName] = String(value)
        }
      })
      
      // Submit to contributions endpoint using venue.id (numeric ID)
      await api.post(`/contributions/venue/${venue.id}/add-category/`, {
        category_slug: selectedCategory.slug,
        field_values: fieldValuesObj
      })
      
      setSuccess(true)
    } catch (err) {
      console.error('Submission failed:', err)
      setError(err.response?.data?.detail || err.response?.data?.message || 'Could not submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Back to search
  const handleBackToSearch = () => {
    setSelectedCategory(null)
    setCategoryFields([])
    setFieldValues({})
    setError('')
  }

  // Render field input based on type
  const renderFieldInput = (field) => {
    const value = fieldValues[field.name] || ''
    
    switch (field.field_type) {
      case 'boolean':
        return (
          <div className="field-boolean-group">
            <label className={`field-boolean-option ${value === 'true' ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`field-${field.name}`}
                value="true"
                checked={value === 'true'}
                onChange={() => handleFieldChange(field.name, 'true')}
              />
              <span className="bool-label yes">Yes</span>
            </label>
            <label className={`field-boolean-option ${value === 'false' ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`field-${field.name}`}
                value="false"
                checked={value === 'false'}
                onChange={() => handleFieldChange(field.name, 'false')}
              />
              <span className="bool-label no">No</span>
            </label>
            <label className={`field-boolean-option ${value === '' ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`field-${field.name}`}
                value=""
                checked={value === ''}
                onChange={() => handleFieldChange(field.name, '')}
              />
              <span className="bool-label unknown">Unknown</span>
            </label>
          </div>
        )
      
      case 'number':
        return (
          <input
            type="number"
            className="field-input"
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        )
      
      case 'url':
        return (
          <input
            type="url"
            className="field-input"
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder="https://..."
          />
        )
      
      case 'text':
      default:
        return (
          <input
            type="text"
            className="field-input"
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        )
    }
  }

  if (venueLoading) {
    return (
      <div>
        <Navbar />
        <div className="venue-loading">Loading…</div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div>
        <Navbar />
        <div className="venue-loading">
          <h2>Venue not found</h2>
          <p>The link might be broken or the venue is no longer active.</p>
          <Link to="/" className="btn-edit" style={{ marginTop: 16, display: 'inline-block' }}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div>
        <Navbar />
        <main className="add-category-page">
          <div className="add-category-box">
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h2>Contribution Submitted</h2>
              <p>
                Your request to add <strong>{venue.name}</strong> to{' '}
                <strong>{selectedCategory.name}</strong> has been submitted for review.
              </p>
              <p className="success-hint">
                A moderator will review your contribution shortly.
              </p>
              <div className="success-actions">
                <button 
                  className="btn-primary"
                  onClick={() => navigate(`/venue/${venueSlug}`)}
                >
                  Back to {venue.name}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setSuccess(false)
                    setSelectedCategory(null)
                    setCategoryFields([])
                    setFieldValues({})
                    setQuery('')
                  }}
                >
                  Add Another Category
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <main className="add-category-page">
        <div className="add-category-box">
          {/* BREADCRUMB */}
          <nav className="venue-breadcrumb">
            <Link to="/">Mapedia</Link>
            <span className="venue-breadcrumb-sep">›</span>
            <Link to={`/venue/${venueSlug}`}>{venue.name}</Link>
            <span className="venue-breadcrumb-sep">›</span>
            <span>Add Category</span>
          </nav>

          <h1 className="add-category-title">Add Category to {venue.name}</h1>
          <p className="add-category-desc">
            Add this venue to another category. Fill in the category-specific details and submit for review.
          </p>

          {/* Current Categories */}
          {venue.categories?.length > 0 && (
            <div className="current-categories">
              <h3>Current Categories</h3>
              <div className="venue-meta-row">
                {venue.categories.map(cat => (
                  <Link 
                    key={cat.category_slug} 
                    to={`/category/${cat.category_slug}`} 
                    className="venue-tag"
                  >
                    {cat.category_name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Category Search (shown when no category selected) */}
          {!selectedCategory && (
            <div className="add-category-search">
              <h3>Step 1: Search for a category to add</h3>
              <input
                autoFocus
                type="text"
                className="filter-input add-category-input"
                placeholder="Search categories…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              
              {searchLoading && <p className="search-hint">Searching…</p>}
              
              {!searchLoading && query.length >= 2 && results.length === 0 && (
                <p className="search-hint">
                  No categories found. Try a different search term.
                </p>
              )}

              {results.length > 0 && (
                <ul className="category-results">
                  {results.map(cat => (
                    <li key={cat.slug} className="category-result-item">
                      <div className="category-result-info">
                        <span className="category-result-name">{cat.name}</span>
                        {cat.description && (
                          <span className="category-result-desc">{cat.description}</span>
                        )}
                      </div>
                      <button
                        className="btn-apply"
                        onClick={() => handleSelectCategory(cat)}
                      >
                        Select
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* STEP 2: Fill in fields (shown when category is selected) */}
          {selectedCategory && (
            <div className="category-fields-section">
              <div className="selected-category-header">
                <div>
                  <h3>Step 2: Fill in details for {selectedCategory.name}</h3>
                  <p className="selected-category-hint">
                    Fill in the fields below. You can leave fields empty if you don't know the answer.
                  </p>
                </div>
                <button className="btn-back" onClick={handleBackToSearch}>
                  ← Change Category
                </button>
              </div>

              {fieldsLoading && (
                <div className="fields-loading">Loading fields…</div>
              )}

              {!fieldsLoading && categoryFields.length === 0 && (
                <div className="no-fields-message">
                  <p>This category doesn't have any custom fields.</p>
                  <p>You can submit directly to add {venue.name} to {selectedCategory.name}.</p>
                </div>
              )}

              {!fieldsLoading && categoryFields.length > 0 && (
                <div className="fields-form">
                  {categoryFields.map(field => (
                    <div key={field.name} className="field-row">
                      <label className="field-label-text">
                        {field.label}
                        {field.required && <span className="required-mark">*</span>}
                      </label>
                      {renderFieldInput(field)}
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="add-category-error">{error}</p>}

              <div className="submit-section">
                <button 
                  className="btn-primary btn-submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit Contribution'}
                </button>
                <p className="submit-hint">
                  Your contribution will be reviewed by a moderator before it becomes visible.
                </p>
              </div>
            </div>
          )}

          {/* Back Button */}
          {!selectedCategory && (
            <div className="add-category-actions">
              <button 
                className="btn-secondary" 
                onClick={() => navigate(`/venue/${venueSlug}`)}
              >
                ← Back to {venue.name}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AddCategoryPage