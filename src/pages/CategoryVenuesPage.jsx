// src/pages/CategoryVenuesPage.jsx

import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/CategoryVenuesPage.css'

const PAGE_SIZE = 20

function CategoryVenuesPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [category, setCategory] = useState(null)
  const [venues, setVenues] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters from URL
  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const city = searchParams.get('city') || ''
  const sortBy = searchParams.get('sort') || '-created_at'

  // Local filter states
  const [searchInput, setSearchInput] = useState(search)
  const [cityInput, setCityInput] = useState(city)

  useEffect(() => {
    setLoading(true)
    
    // Build query params
    const params = new URLSearchParams({
      category: slug,
      page: page.toString(),
      page_size: PAGE_SIZE.toString(),
    })
    
    if (search) params.append('search', search)
    if (city) params.append('city', city)
    if (sortBy) params.append('ordering', sortBy)

    Promise.all([
      api.get(`/categories/${slug}/`),
      api.get(`/venues/?${params.toString()}`)
    ])
      .then(([catRes, venuesRes]) => {
        setCategory(catRes.data)
        setVenues(venuesRes.data.results || venuesRes.data || [])
        setTotalCount(venuesRes.data.count || venuesRes.data.length || 0)
        document.title = `${catRes.data.name} Venues | Mapedia`
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load venues.')
        setLoading(false)
      })
  }, [slug, page, search, city, sortBy])

  // Update URL params
  const updateFilters = (newParams) => {
    const current = Object.fromEntries(searchParams.entries())
    const updated = { ...current, ...newParams, page: '1' }
    
    // Remove empty params
    Object.keys(updated).forEach(key => {
      if (!updated[key]) delete updated[key]
    })
    
    setSearchParams(updated)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateFilters({ search: searchInput, city: cityInput })
  }

  const handlePageChange = (newPage) => {
    const current = Object.fromEntries(searchParams.entries())
    setSearchParams({ ...current, page: newPage.toString() })
    window.scrollTo(0, 0)
  }

  const handleSort = (newSort) => {
    updateFilters({ sort: newSort })
  }

  const clearFilters = () => {
    setSearchInput('')
    setCityInput('')
    setSearchParams({})
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const hasFilters = search || city

  // Pagination numbers
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const left = Math.max(1, page - delta)
    const right = Math.min(totalPages, page + delta)

    for (let i = left; i <= right; i++) {
      range.push(i)
    }

    if (left > 2) range.unshift('...')
    if (left > 1) range.unshift(1)
    if (right < totalPages - 1) range.push('...')
    if (right < totalPages) range.push(totalPages)

    return range
  }

  if (loading && !category) {
    return (
      <div>
        <Navbar />
        <main className="catvenues-main">
          <div className="catvenues-loading">Loading…</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <main className="catvenues-main">
          <div className="catvenues-error">{error}</div>
          <Link to={`/category/${slug}`}>← Back to category</Link>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <main className="catvenues-main">
        <div className="catvenues-container">

          {/* HEADER */}
          <div className="catvenues-header">
            <nav className="catvenues-breadcrumb">
              <Link to="/">Mapedia</Link>
              <span>›</span>
              <Link to="/categories">Categories</Link>
              <span>›</span>
              <Link to={`/category/${slug}`}>{category?.name}</Link>
              <span>›</span>
              <span>Venues</span>
            </nav>
            
            <h1 className="catvenues-title">
              {category?.icon && <span className="catvenues-icon">{category.icon}</span>}
              {category?.name} Venues
            </h1>
            
            <p className="catvenues-subtitle">
              {totalCount} venue{totalCount !== 1 ? 's' : ''} in this category
            </p>
          </div>

          {/* TOOLBAR */}
          <div className="catvenues-toolbar">
            <form onSubmit={handleSearch} className="catvenues-filters">
              <input
                type="text"
                placeholder="Search venues..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="catvenues-search"
              />
              <input
                type="text"
                placeholder="Filter by city..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="catvenues-city"
              />
              <button type="submit" className="catvenues-search-btn">
                Search
              </button>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="catvenues-clear-btn">
                  Clear
                </button>
              )}
            </form>
            
            <select 
              value={sortBy} 
              onChange={(e) => handleSort(e.target.value)}
              className="catvenues-sort"
            >
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="name">Name A-Z</option>
              <option value="-name">Name Z-A</option>
              <option value="city">City A-Z</option>
            </select>
          </div>

          {/* RESULTS INFO */}
          {hasFilters && (
            <div className="catvenues-results-info">
              Showing {venues.length} of {totalCount} results
              {search && <span> for "{search}"</span>}
              {city && <span> in {city}</span>}
            </div>
          )}

          {/* VENUES TABLE */}
          {loading ? (
            <div className="catvenues-loading">Loading venues…</div>
          ) : venues.length === 0 ? (
            <div className="catvenues-empty">
              <p>No venues found{hasFilters ? ' matching your filters' : ''}.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="catvenues-clear-btn">
                  Clear filters
                </button>
              )}
              <Link to={`/contribute?category=${slug}`} className="catvenues-add-link">
                + Add the first venue
              </Link>
            </div>
          ) : (
            <table className="catvenues-table">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>City</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {venues.map(venue => (
                  <tr key={venue.id}>
                    <td>
                      <Link to={`/venue/${venue.slug}`} className="catvenues-venue-link">
                        {venue.name}
                      </Link>
                    </td>
                    <td>{venue.city || '—'}</td>
                    <td>{venue.country || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="catvenues-pagination">
              <button
                className="catvenues-page-btn"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                ← Prev
              </button>

              <div className="catvenues-page-numbers">
                {getPageNumbers().map((num, i) =>
                  num === '...' ? (
                    <span key={`dots-${i}`} className="catvenues-page-dots">…</span>
                  ) : (
                    <button
                      key={num}
                      className={`catvenues-page-btn ${page === num ? 'active' : ''}`}
                      onClick={() => handlePageChange(num)}
                    >
                      {num}
                    </button>
                  )
                )}
              </div>

              <button
                className="catvenues-page-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next →
              </button>

              <span className="catvenues-page-info">
                Page {page} of {totalPages}
              </span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="catvenues-footer-actions">
            <Link to={`/category/${slug}/map`} className="catvenues-map-btn">
              View on Map
            </Link>
            <Link to={`/contribute?category=${slug}`} className="catvenues-add-btn">
              + Add Venue
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}

export default CategoryVenuesPage