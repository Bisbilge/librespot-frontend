import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/client';
import '../styles/HomePage.css';

function HomePage() {
  const [categories, setCategories] = useState([]);
  const [venueCount, setVenueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        const [categoriesRes, venuesRes] = await Promise.all([
          api.get('/categories/'),
          api.get('/venues/')
        ]);
        setCategories(categoriesRes.data.results || categoriesRes.data);
        setVenueCount(venuesRes.data.count || 0);
      } catch (err) {
        console.error("Veri çekilirken hata oluştu:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">

        {/* HERO */}
        <section className="home-hero">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-title-map">Map</span>edia
            </h1>
            <p className="hero-subtitle">The Free Encyclopedia of Places</p>
            <p className="hero-description">
              Mapedia is a community-maintained open database of geographical locations and venues.
              Unlike conventional mapping services, Mapedia documents the practical details that matter —
              entry procedures, accessibility, available utilities, and the granular micro-data
              that no algorithm collects.
            </p>
            <div className="hero-actions">
              <Link to="/contribute" className="hero-btn-primary">Contribute a Place</Link>
              <Link to="/about" className="hero-btn-secondary">Learn More</Link>
            </div>
          </div>
        </section>

        {/* STATS */}
        {!isLoading && !error && (
          <section className="home-stats-section">
            <div className="home-stats">
              <div className="stat">
                <span className="stat-number">{venueCount.toLocaleString()}</span>
                <span className="stat-label">Places documented</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-number">{categories.length}</span>
                <span className="stat-label">Categories</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-number">CC BY-SA</span>
                <span className="stat-label">Open license</span>
              </div>
            </div>
          </section>
        )}

        {/* CATEGORIES */}
        <section className="home-categories">
          <div className="section-header">
            <h2>Browse by Category</h2>
            <p className="section-sub">
              Each category is maintained by community moderators and defines its own data fields.
            </p>
          </div>

          {isLoading ? (
            <div className="loading-spinner">Loading categories…</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : categories.length > 0 ? (
            <div className="category-grid">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/category/${cat.slug}`} className="category-card">
                  <span className="category-name">{cat.name}</span>
                  {cat.description && (
                    <span className="category-desc">{cat.description}</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No categories yet. <Link to="/create-category">Create the first one.</Link></p>
            </div>
          )}
        </section>

        {/* OPEN DATA PANEL */}
        <section className="home-opendata">
          <div className="opendata-inner">
            <div className="opendata-text">
              <h2>Open Data</h2>
              <p>
                Every place on Mapedia is published under the{' '}
                <strong>Creative Commons Attribution-ShareAlike 4.0</strong> license.
                The data belongs to no one and to everyone — free to use, build upon,
                and redistribute, as long as the same freedom is preserved.
              </p>
              <Link to="/license" className="opendata-link">About the license →</Link>
            </div>
            <div className="opendata-badge">
              <span className="badge-cc">CC</span>
              <span className="badge-label">BY-SA 4.0</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default HomePage;