import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import '../styles/Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('access')
  const username = localStorage.getItem('username')
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ categories: [], venues: [], users: [] })
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  
  const searchRef = useRef(null)
  const searchTimeout = useRef(null)

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [navigate])

  function handleLogout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('username')
    navigate('/')
    setMenuOpen(false)
  }

  function handleSearchChange(e) {
    const val = e.target.value
    setQuery(val)
    
    // Debounce
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (val.length < 2) {
      setResults({ categories: [], venues: [], users: [] })
      setShowResults(false)
      return
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(val)
    }, 250)
  }

  async function performSearch(searchQuery) {
    setLoading(true)
    try {
      const [catRes, venRes, userRes] = await Promise.all([
        api.get(`/categories/?search=${encodeURIComponent(searchQuery)}`),
        api.get(`/venues/?search=${encodeURIComponent(searchQuery)}&page_size=5`),
        api.get(`/users/?search=${encodeURIComponent(searchQuery)}`).catch(() => ({ data: [] }))
      ])
      
      setResults({
        categories: (catRes.data.results || catRes.data).slice(0, 5),
        venues: (venRes.data.results || venRes.data).slice(0, 5),
        users: (userRes.data.results || userRes.data || []).slice(0, 5)
      })
      setShowResults(true)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(type, slug) {
    clearSearch()
    if (type === 'category') navigate(`/category/${slug}`)
    else if (type === 'venue') navigate(`/venue/${slug}`)
    else if (type === 'user') navigate(`/profile/${slug}`)
  }

  function clearSearch() {
    setQuery('')
    setResults({ categories: [], venues: [], users: [] })
    setShowResults(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      clearSearch()
    }
  }

  const hasResults = results.categories.length > 0 || results.venues.length > 0 || results.users.length > 0
  const totalResults = results.categories.length + results.venues.length + results.users.length

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* LOGO */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-text">Mapedia</span>
          <span className="logo-tagline">The Free Encyclopedia of Places</span>
        </Link>

        {/* SEARCH */}
        <div className="navbar-search" ref={searchRef}>
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search places, categories, users..."
              value={query}
              onChange={handleSearchChange}
              onFocus={() => { if (hasResults) setShowResults(true) }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {query && (
              <button className="search-clear" onClick={clearSearch} aria-label="Clear search">
                ✕
              </button>
            )}
            {loading && <span className="search-spinner" />}
            
            {/* DROPDOWN */}
            {showResults && (
              <div className="search-dropdown">
                {!hasResults && query.length >= 2 && !loading && (
                  <div className="search-empty">
                    <p>No results for "{query}"</p>
                  </div>
                )}

                {/* PLACES */}
                {results.venues.length > 0 && (
                  <div className="search-group">
                    <div className="search-group-header">
                      <span className="search-group-icon">📍</span>
                      <span className="search-group-title">Places</span>
                      <span className="search-group-count">{results.venues.length}</span>
                    </div>
                    {results.venues.map(venue => (
                      <button
                        key={`ven-${venue.id}`}
                        className="search-item"
                        onClick={() => handleSelect('venue', venue.slug)}
                      >
                        <div className="search-item-content">
                          <span className="search-item-name">{venue.name}</span>
                          <span className="search-item-meta">
                            {[venue.city, venue.country].filter(Boolean).join(', ') || 'Unknown location'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* CATEGORIES */}
                {results.categories.length > 0 && (
                  <div className="search-group">
                    <div className="search-group-header">
                      <span className="search-group-icon">📁</span>
                      <span className="search-group-title">Categories</span>
                      <span className="search-group-count">{results.categories.length}</span>
                    </div>
                    {results.categories.map(cat => (
                      <button
                        key={`cat-${cat.id}`}
                        className="search-item"
                        onClick={() => handleSelect('category', cat.slug)}
                      >
                        <div className="search-item-content">
                          <span className="search-item-name">
                            {cat.icon && <span className="search-item-icon">{cat.icon}</span>}
                            {cat.name}
                          </span>
                          {cat.venue_count > 0 && (
                            <span className="search-item-meta">
                              {cat.venue_count} place{cat.venue_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* USERS */}
                {results.users.length > 0 && (
                  <div className="search-group">
                    <div className="search-group-header">
                      <span className="search-group-icon">👤</span>
                      <span className="search-group-title">Users</span>
                      <span className="search-group-count">{results.users.length}</span>
                    </div>
                    {results.users.map(user => (
                      <button
                        key={`user-${user.id}`}
                        className="search-item"
                        onClick={() => handleSelect('user', user.username)}
                      >
                        <div className="search-item-content">
                          <span className="search-item-name">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt="" 
                                className="search-user-avatar" 
                              />
                            ) : (
                              <span className="search-user-avatar-placeholder">
                                {user.username[0].toUpperCase()}
                              </span>
                            )}
                            {user.username}
                          </span>
                          {user.contribution_count > 0 && (
                            <span className="search-item-meta">
                              {user.contribution_count} contribution{user.contribution_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* FOOTER */}
                {hasResults && (
                  <div className="search-footer">
                    <span>{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
                    <span className="search-footer-hint">Press Esc to close</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* HAMBURGER */}
        <button
          className={`navbar-menu-btn ${menuOpen ? 'navbar-menu-btn-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        {/* NAV LINKS */}
        <nav className={`navbar-links ${menuOpen ? 'navbar-links-open' : ''}`}>
          <Link to="/categories" className="navbar-link" onClick={() => setMenuOpen(false)}>
            Categories
          </Link>
          <Link to="/about" className="navbar-link" onClick={() => setMenuOpen(false)}>
            About
          </Link>
          
          {token ? (
            <>
              <div className="navbar-divider" />
              <Link to="/contribute" className="navbar-link" onClick={() => setMenuOpen(false)}>
                Contribute
              </Link>
              <Link to="/create-category" className="navbar-link" onClick={() => setMenuOpen(false)}>
                New Category
              </Link>
              <Link to="/moderation" className="navbar-link navbar-link-mod" onClick={() => setMenuOpen(false)}>
                Moderation
              </Link>
              <div className="navbar-divider" />
              <Link to="/profile" className="navbar-profile" onClick={() => setMenuOpen(false)}>
                <span className="navbar-profile-avatar">
                  {username ? username[0].toUpperCase() : '?'}
                </span>
                <span className="navbar-profile-name">{username || 'Profile'}</span>
              </Link>
              <button onClick={handleLogout} className="navbar-logout">
                Log out
              </button>
            </>
          ) : (
            <>
              <div className="navbar-divider" />
              <Link to="/login" className="navbar-btn-login" onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
              <Link to="/register" className="navbar-btn-register" onClick={() => setMenuOpen(false)}>
                Sign up
              </Link>
            </>
          )}
        </nav>

      </div>
      
      {/* MOBILE OVERLAY */}
      {menuOpen && <div className="navbar-overlay" onClick={() => setMenuOpen(false)} />}
    </header>
  )
}

export default Navbar