import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Sayfa yenilenmesini önlemek için eklendi
import Navbar from '../components/Navbar';
import api from '../api/client';
import '../styles/HomePage.css';

function HomePage() {
  const [categories, setCategories] = useState([]);
  const [venueCount, setVenueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Yüklenme durumu eklendi
  const [error, setError] = useState(null); // Hata durumu eklendi

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        // İki API isteğini aynı anda (paralel) başlatarak hızı artırıyoruz
        const [categoriesRes, venuesRes] = await Promise.all([
          api.get('/categories/'),
          api.get('/venues/')
        ]);

        setCategories(categoriesRes.data.results || categoriesRes.data);
        setVenueCount(venuesRes.data.count || 0);
      } catch (err) {
        console.error("Veri çekilirken hata oluştu:", err);
        setError("Veriler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.");
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
        <section className="home-hero">
          <div className="home-intro">
            <h1>Welcome to Mapedia</h1>
            <p className="home-tagline">
            Mapedia is an independent, community-driven encyclopedia of geographical locations and venues, 
            designed to document granular data—such as specific access protocols, structural accessibility, 
            and utility availability—that mainstream mapping services typically overlook. Users can leverage 
            this platform to search for essential details like entry codes and power outlet locations, or 
            contribute to the knowledge base by submitting new data and verifying existing entries through 
            our community-driven verification system.
            </p>
            
            {/* Yükleme ve Hata Durumlarını Ele Alma */}
            {isLoading ? (
              <div className="loading-spinner">İstatistikler yükleniyor...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
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
            )}
          </div>
        </section>

        <section className="home-categories">
          <h2>Browse by Category</h2>
          
          {isLoading ? (
            <div className="loading-spinner">Kategoriler yükleniyor...</div>
          ) : categories.length > 0 ? (
            <div className="category-grid">
              {categories.map((cat) => (
                // Standart <a> etiketi yerine react-router-dom Link bileşeni kullanıldı
                <Link key={cat.id} to={`/category/${cat.slug}`} className="category-card">
                  <span className="category-name">{cat.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No categories yet.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default HomePage;