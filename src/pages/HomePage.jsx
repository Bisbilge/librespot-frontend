import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/HomePage.css'

function HomePage() {
  const [categories, setCategories] = useState([])
  const [venueCount, setVenueCount] = useState(0)

  useEffect(() => {
    api.get('/categories/').then(res => setCategories(res.data.results || res.data))
    api.get('/venues/').then(res => setVenueCount(res.data.count || 0))
  }, [])

  return (
    <div>
      <Navbar />
      <main className="home-main">
        <div className="home-content">
          <div className="home-intro">
            <h1>Welcome to LibreSpot</h1>
            <p className="home-tagline">
              LibreSpot is a free, community-driven encyclopedia of places.
              Find hidden details about venues that mainstream maps never tell you —
              access codes, wheelchair accessibility, free outlets, and more.
            </p>
            <div className="home-stats">
              <div className="stat">
                <span className="stat-number">{venueCount}</span>
                <span className="stat-label">Venues</span>
              </div>
              <div className="stat">
                <span className="stat-number">{categories.length}</span>
                <span className="stat-label">Categories</span>
              </div>
            </div>
          </div>
          <div className="home-categories">
            <h2>Browse by Category</h2>
            <div className="category-grid">
              {categories.length > 0 ? categories.map(cat => (
                <a key={cat.id} href={`/category/${cat.slug}`} className="category-card">
                  {cat.name}
                </a>
              )) : (
                <p style={{color: 'var(--text-light)', fontSize: '14px'}}>No categories yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomePage