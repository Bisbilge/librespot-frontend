import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import '../styles/Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('access')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/')
    setMenuOpen(false)
  }

  function handleSearch(e) {
    const val = e.target.value
    setQuery(val)
    if (val.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    api.get('/categories/?search=' + val).then(function(res) {
      setResults(res.data.results || res.data)
      setShowResults(true)
    })
  }

  function handleSelect(slug) {
    setQuery('')
    setResults([])
    setShowResults(false)
    navigate('/category/' + slug)
  }

  function handleBlur() {
    setTimeout(function() { setShowResults(false) }, 150)
  }

  function handleNavClick() {
    setMenuOpen(false)
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* LOGO */}
        <Link to="/" className="navbar-logo" onClick={handleNavClick}>
          <span className="logo-text">Mapedia</span>
          <span className="logo-tagline">The Free Encyclopedia of Places</span>
        </Link>

        {/* SEARCH */}
        <div className="navbar-search">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search categories..."
              value={query}
              onChange={handleSearch}
              onBlur={handleBlur}
              onFocus={function() { if (results.length > 0) setShowResults(true) }}
            />
            {showResults && results.length > 0 && (
              <div className="search-dropdown">
                {results.map(function(cat) {
                  return (
                    <button
                      key={cat.id}
                      className="search-result-item"
                      onClick={function() { handleSelect(cat.slug) }}
                    >
                      <span className="search-result-name">{cat.name}</span>
                      {cat.description && (
                        <span className="search-result-desc">{cat.description}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
            {showResults && results.length === 0 && query.length >= 2 && (
              <div className="search-dropdown">
                <p className="search-no-results">No categories found.</p>
              </div>
            )}
          </div>
        </div>

        {/* HAMBURGER */}
        <button
          className="navbar-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* NAV LINKS */}
        <nav className={`navbar-links${menuOpen ? ' navbar-links-open' : ''}`}>
          <Link to="/about" className="navbar-link" onClick={handleNavClick}>About</Link>
          {token && (
            <Link to="/contribute" className="navbar-link" onClick={handleNavClick}>Contribute</Link>
          )}
          {token && (
            <Link to="/create-category" className="navbar-link" onClick={handleNavClick}>New Category</Link>
          )}
          {token && (
            <Link to="/moderation" className="navbar-link" onClick={handleNavClick}>Moderation</Link>
          )}
          {token && (
            <Link to="/profile" className="navbar-profile navbar-link" onClick={handleNavClick}>Profile</Link>
          )}
          {token ? (
            <button onClick={handleLogout} className="navbar-logout">Log out</button>
          ) : (
            <Link to="/login" className="navbar-btn-login" onClick={handleNavClick}>Log in</Link>
          )}
        </nav>

      </div>
    </header>
  )
}

export default Navbar