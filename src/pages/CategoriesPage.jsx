// src/pages/CategoriesPage.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/CategoriesPage.css'

const PAGE_SIZE = 24

function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('-venue_count')
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState({ totalVenues: 0, totalCategories: 0 })

  useEffect(() => {
    document.title = "Categories | Mapedia"
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await api.get('/categories/')
      const data = res.data.results || res.data
      setCategories(data)
      
      // İstatistikleri hesapla
      const totalVenues = data.reduce((sum, cat) => sum + (cat.venue_count || 0), 0)
      setStats({
        totalCategories: data.length,
        totalVenues: totalVenues
      })
    } catch (err) {
      console.error('Categories load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter
  const filteredCategories = categories.filter(cat => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      cat.name?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q) ||
      cat.slug?.toLowerCase().includes(q)
    )
  })

  // Sort
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === '-name') return b.name.localeCompare(a.name)
    if (sortBy === '-venue_count') return (b.venue_count || 0) - (a.venue_count || 0)
    if (sortBy === 'venue_count') return (a.venue_count || 0) - (b.venue_count || 0)
    if (sortBy === '-field_count') return (b.field_count || 0) - (a.field_count || 0)
    if (sortBy === '-created') return new Date(b.created_at) - new Date(a.created_at)
    return 0
  })

  // Paginate
  const totalPages = Math.ceil(sortedCategories.length / PAGE_SIZE)
  const paginatedCategories = sortedCategories.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  // Reset page on filter/sort change
  useEffect(() => {
    setPage(1)
  }, [search, sortBy])

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

  // Büyük kategorileri belirle (en fazla venue'ya sahip ilk 3)
  const topCategories = [...categories]
    .sort((a, b) => (b.venue_count || 0) - (a.venue_count || 0))
    .slice(0, 3)
    .map(c => c.id)

  return (
    <div>
      <Navbar />
      <main className="categories-main">
        <div className="categories-container">

          {/* HEADER */}
          <div className="categories-header">
            <h1>Categories</h1>
            <p className="categories-desc">
              Browse all community-maintained categories. Each category defines its own data schema 
              and is managed by volunteer moderators.
            </p>
          </div>

          {/* STATS BAR */}
          <div className="categories-stats">
            <div className="categories-stat">
              <span className="categories-stat-value">{stats.totalCategories}</span>
              <span className="categories-stat-label">Categories</span>
            </div>
            <div className="categories-stat">
              <span className="categories-stat-value">{stats.totalVenues.toLocaleString()}</span>
              <span className="categories-stat-label">Total Venues</span>
            </div>
            <div className="categories-stat">
              <span className="categories-stat-value">
                {categories.filter(c => c.venue_count > 0).length}
              </span>
              <span className="categories-stat-label">Active Categories</span>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="categories-toolbar">
            <input
              type="text"
              className="categories-search"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="categories-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="-venue_count">Most venues</option>
              <option value="venue_count">Fewest venues</option>
              <option value="name">Name A-Z</option>
              <option value="-name">Name Z-A</option>
              <option value="-field_count">Most fields</option>
              <option value="-created">Newest</option>
            </select>
            <Link to="/create-category" className="categories-create-btn">
              + New Category
            </Link>
          </div>

          {/* RESULTS INFO */}
          {search && (
            <p className="categories-results-info">
              {filteredCategories.length} result{filteredCategories.length !== 1 ? 's' : ''} for "{search}"
              <button className="categories-clear-search" onClick={() => setSearch('')}>
                Clear
              </button>
            </p>
          )}

          {/* CONTENT */}
          {loading ? (
            <div className="categories-loading">Loading categories...</div>
          ) : paginatedCategories.length === 0 ? (
            <div className="categories-empty">
              {search ? (
                <>
                  <p>No categories match "{search}"</p>
                  <button className="categories-clear-btn" onClick={() => setSearch('')}>
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <p>No categories yet.</p>
                  <Link to="/create-category" className="categories-create-link">
                    Create the first one →
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {/* TABLE VIEW */}
              <div className="categories-table-wrapper">
                <table className="categories-table">
                  <thead>
                    <tr>
                      <th className="col-name">Category</th>
                      <th className="col-venues">Venues</th>
                      <th className="col-fields">Fields</th>
                      <th className="col-owner">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.map(cat => (
                      <tr key={cat.id} className={topCategories.includes(cat.id) ? 'top-category' : ''}>
                        <td className="col-name">
                          <Link to={`/category/${cat.slug}`} className="category-link">
                            {cat.icon && <span className="category-icon">{cat.icon}</span>}
                            <div className="category-info">
                              <span className="category-name">{cat.name}</span>
                              {cat.description && (
                                <span className="category-desc">
                                  {cat.description.length > 80 
                                    ? cat.description.slice(0, 80) + '...' 
                                    : cat.description}
                                </span>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="col-venues">
                          <span className={`venue-count ${cat.venue_count > 0 ? 'has-venues' : 'no-venues'}`}>
                            {cat.venue_count || 0}
                          </span>
                        </td>
                        <td className="col-fields">
                          <span className="field-count">
                            {cat.field_count || cat.field_definitions?.length || '—'}
                          </span>
                        </td>
                        <td className="col-owner">
                          {cat.owner_username ? (
                            <Link to={`/profile/${cat.owner_username}`} className="owner-link">
                              @{cat.owner_username}
                            </Link>
                          ) : (
                            <span className="no-owner">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="categories-pagination">
                  <button
                    className="categories-page-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Prev
                  </button>

                  <div className="categories-page-numbers">
                    {getPageNumbers().map((num, i) =>
                      num === '...' ? (
                        <span key={`dots-${i}`} className="categories-page-dots">…</span>
                      ) : (
                        <button
                          key={num}
                          className={`categories-page-btn ${page === num ? 'categories-page-btn-active' : ''}`}
                          onClick={() => setPage(num)}
                        >
                          {num}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    className="categories-page-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next →
                  </button>

                  <span className="categories-page-info">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedCategories.length)} of {sortedCategories.length}
                  </span>
                </div>
              )}
            </>
          )}

          {/* INFO BOX */}
          <div className="categories-info-box">
            <h3>About Categories</h3>
            <p>
              Categories on Mapedia are community-created and maintained. Each category 
              can define custom fields relevant to its type of places — for example, a "Cafes" 
              category might have fields for Wi-Fi availability, outdoor seating, and price range.
            </p>
            <p>
              Anyone can <Link to="/create-category">create a new category</Link> and become 
              its owner/moderator. Data is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

export default CategoriesPage