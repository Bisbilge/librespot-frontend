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

  function handleLogout() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/')
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
    setTimeout(function() {
      setShowResults(false)
    }, 150)
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Mapedia</span>
          <span className="logo-tagline">The Free Encyclopedia of Places</span>
        </Link>
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
        <nav className="navbar-links">
          <Link to="/contribute">Contribute</Link>
          {token && (
            <Link to="/moderation">Moderation</Link>
          )}
          {token && (
            <Link to="/profile" className="navbar-profile">Profile</Link>
          )}
          {token ? (
            <button onClick={handleLogout} className="navbar-logout">Log out</button>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar