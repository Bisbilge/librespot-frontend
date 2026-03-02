// src/pages/ProfilePage.jsx

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/client';
import '../styles/ProfilePage.css';

const TABS = [
  { key: 'contributions', label: 'Contributions' },
  { key: 'venues', label: 'Contributed Venues' },
  { key: 'ratings', label: 'Ratings' },
  { key: 'categories', label: 'Categories' },
  { key: 'stats', label: 'Stats' },
];

const PAGE_SIZE = 15;

// ─── PAGINATION COMPONENT ───────────────────────────────────────
function Pagination({ currentPage, totalPages, totalCount, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (left > 2) range.unshift('...');
    if (left > 1) range.unshift(1);
    if (right < totalPages - 1) range.push('...');
    if (right < totalPages) range.push(totalPages);

    return range;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="profile-pagination">
      <button
        className="profile-page-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Prev
      </button>

      <div className="profile-page-numbers">
        {getPageNumbers().map((num, i) =>
          num === '...' ? (
            <span key={`dots-${i}`} className="profile-page-dots">…</span>
          ) : (
            <button
              key={num}
              className={`profile-page-btn ${currentPage === num ? 'profile-page-btn-active' : ''}`}
              onClick={() => onPageChange(num)}
            >
              {num}
            </button>
          )
        )}
      </div>

      <button
        className="profile-page-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next →
      </button>

      <span className="profile-page-info">
        {startItem}–{endItem} of {totalCount}
      </span>
    </div>
  );
}

// ─── STAR RATING DISPLAY ───────────────────────────────────────
function StarRating({ rating, size = 'medium' }) {
  const sizeClass = size === 'small' ? 'stars-small' : size === 'large' ? 'stars-large' : '';
  
  return (
    <span className={`star-rating ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>★</span>
      ))}
    </span>
  );
}

// ─── STATUS FILTER COMPONENT ───────────────────────────────────────
function StatusFilter({ value, onChange, counts }) {
  const filters = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <div className="profile-status-filter">
      {filters.map(f => (
        <button
          key={f.key}
          className={`profile-filter-btn ${value === f.key ? 'profile-filter-btn-active' : ''}`}
          onClick={() => onChange(f.key)}
        >
          {f.label}
          {f.count > 0 && <span className="profile-filter-count">{f.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── CONTRIBUTIONS TAB ───────────────────────────────────────
function ContributionsTab({ contributions }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    setPage(1);
  }, [statusFilter, sortBy]);

  const counts = useMemo(() => {
    if (!contributions) return { all: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      all: contributions.length,
      pending: contributions.filter(c => c.status === 'pending').length,
      approved: contributions.filter(c => c.status === 'approved').length,
      rejected: contributions.filter(c => c.status === 'rejected').length,
    };
  }, [contributions]);

  const filteredContributions = useMemo(() => {
    if (!contributions) return [];
    
    let result = [...contributions];
    
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'date_asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
    
    return result;
  }, [contributions, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredContributions.length / PAGE_SIZE);
  const paginatedContributions = filteredContributions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  if (!contributions || contributions.length === 0) {
    return <p className="profile-empty">No contributions yet.</p>;
  }

  return (
    <div className="profile-contributions">
      <div className="profile-toolbar">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} counts={counts} />
        
        <select 
          className="profile-sort-select"
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="name">By name</option>
        </select>
      </div>

      {paginatedContributions.length === 0 ? (
        <p className="profile-empty">No {statusFilter} contributions.</p>
      ) : (
        <table className="profile-contributions-table">
          <thead>
            <tr>
              <th>Venue</th>
              <th>Category</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedContributions.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.venue_slug ? (
                    <Link to={`/venue/${c.venue_slug}`} className="profile-link">
                      {c.name || 'Unnamed'}
                    </Link>
                  ) : (
                    <span>{c.name || 'Unnamed'}</span>
                  )}
                </td>
                <td>
                  {c.category_slug ? (
                    <Link to={`/category/${c.category_slug}`} className="profile-category-link">
                      {c.category_slug}
                    </Link>
                  ) : '—'}
                </td>
                <td className="contrib-type">{c.type?.replace('_', ' ') || '—'}</td>
                <td>
                  <span className={`contrib-status contrib-status-${c.status}`}>
                    {c.status}
                  </span>
                </td>
                <td className="contrib-date">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={filteredContributions.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}

// ─── VENUES TAB ───────────────────────────────────────
function VenuesTab({ venues }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredVenues = useMemo(() => {
    if (!venues) return [];
    if (!search.trim()) return venues;
    
    const q = search.toLowerCase();
    return venues.filter(v => 
      v.name?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q) ||
      v.country?.toLowerCase().includes(q) ||
      v.category_name?.toLowerCase().includes(q)
    );
  }, [venues, search]);

  const totalPages = Math.ceil(filteredVenues.length / PAGE_SIZE);
  const paginatedVenues = filteredVenues.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  if (!venues || venues.length === 0) {
    return <p className="profile-empty">Has not contributed to any venues yet.</p>;
  }

  return (
    <div className="profile-venues">
      <div className="profile-toolbar">
        <input
          type="text"
          className="profile-search"
          placeholder="Search venues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="profile-result-count">
          {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''}
          {search && ' found'}
        </span>
      </div>

      {paginatedVenues.length === 0 ? (
        <p className="profile-empty">No venues match your search.</p>
      ) : (
        <div className="profile-venues-grid">
          {paginatedVenues.map((v) => (
            <Link
              key={v.id}
              to={`/venue/${v.slug}`}
              className="profile-venue-card"
            >
              <span className="profile-venue-name">{v.name}</span>
              <span className="profile-venue-meta">
                {[v.city, v.country].filter(Boolean).join(', ') || 'Unknown location'}
              </span>
              {v.category_name && (
                <span className="profile-venue-category">{v.category_name}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={filteredVenues.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}

// ─── RATINGS TAB ───────────────────────────────────────
function RatingsTab({ ratings, username, isOwnProfile }) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('date_desc');
  const [filterScore, setFilterScore] = useState('all');

  useEffect(() => {
    setPage(1);
  }, [sortBy, filterScore]);

  const filteredRatings = useMemo(() => {
    if (!ratings) return [];
    
    let result = [...ratings];
    
    // Filter by score
    if (filterScore !== 'all') {
      const score = parseInt(filterScore);
      result = result.filter(r => r.score === score);
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'date_asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'score_desc') return b.score - a.score;
      if (sortBy === 'score_asc') return a.score - b.score;
      return 0;
    });
    
    return result;
  }, [ratings, sortBy, filterScore]);

  const totalPages = Math.ceil(filteredRatings.length / PAGE_SIZE);
  const paginatedRatings = filteredRatings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Calculate stats
  const stats = useMemo(() => {
    if (!ratings || ratings.length === 0) return null;
    
    const total = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    const avg = sum / total;
    const withComment = ratings.filter(r => r.comment && r.comment.trim()).length;
    
    // Distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => distribution[r.score]++);
    
    // Most given score
    let mostGiven = 5;
    let maxCount = 0;
    for (const [score, count] of Object.entries(distribution)) {
      if (count > maxCount) {
        maxCount = count;
        mostGiven = parseInt(score);
      }
    }
    
    return { total, avg: avg.toFixed(1), withComment, distribution, mostGiven };
  }, [ratings]);

  if (!ratings || ratings.length === 0) {
    return (
      <div className="profile-ratings-empty">
        <p className="profile-empty">
          {isOwnProfile ? "You haven't rated any venues yet." : `${username} hasn't rated any venues yet.`}
        </p>
        {isOwnProfile && (
          <Link to="/" className="profile-cta-btn">Explore venues to rate →</Link>
        )}
      </div>
    );
  }

  return (
    <div className="profile-ratings">
      {/* Rating Summary */}
      <div className="ratings-summary">
        <div className="ratings-summary-main">
          <span className="ratings-summary-avg">{stats.avg}</span>
          <StarRating rating={Math.round(stats.avg)} />
          <span className="ratings-summary-count">{stats.total} ratings</span>
        </div>
        <div className="ratings-summary-details">
          <span>Most given: <strong>{stats.mostGiven}★</strong></span>
          <span>With comments: <strong>{stats.withComment}</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className="profile-toolbar">
        <div className="profile-score-filter">
          <button 
            className={`profile-filter-btn ${filterScore === 'all' ? 'profile-filter-btn-active' : ''}`}
            onClick={() => setFilterScore('all')}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map(score => (
            <button
              key={score}
              className={`profile-filter-btn ${filterScore === String(score) ? 'profile-filter-btn-active' : ''}`}
              onClick={() => setFilterScore(String(score))}
            >
              {score}★ <span className="filter-count-small">({stats.distribution[score]})</span>
            </button>
          ))}
        </div>
        
        <select 
          className="profile-sort-select"
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="score_desc">Highest rated</option>
          <option value="score_asc">Lowest rated</option>
        </select>
      </div>

      {/* Ratings List */}
      {paginatedRatings.length === 0 ? (
        <p className="profile-empty">No {filterScore}★ ratings.</p>
      ) : (
        <div className="profile-ratings-list">
          {paginatedRatings.map((r) => (
            <div key={r.id} className="profile-rating-card">
              <div className="profile-rating-header">
                <Link to={`/venue/${r.venue.slug}`} className="profile-rating-venue">
                  {r.venue.name}
                </Link>
                <StarRating rating={r.score} size="small" />
              </div>
              
              {r.venue.city && (
                <span className="profile-rating-location">
                  📍 {r.venue.city}{r.venue.country ? `, ${r.venue.country}` : ''}
                </span>
              )}
              
              {r.comment && (
                <p className="profile-rating-comment">{r.comment}</p>
              )}
              
              <span className="profile-rating-date">
                {new Date(r.created_at).toLocaleDateString('en-GB', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={filteredRatings.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}

// ─── CATEGORIES TAB ───────────────────────────────────────
function CategoriesTab({ ownedCategories, moderatedCategories }) {
  const hasOwned = ownedCategories?.length > 0;
  const hasModerated = moderatedCategories?.length > 0;

  if (!hasOwned && !hasModerated) {
    return <p className="profile-empty">No categories yet.</p>;
  }

  return (
    <div className="profile-categories">
      {hasOwned && (
        <div className="profile-cat-section">
          <h3 className="profile-cat-title">
            Categories Owned
            <span className="profile-cat-count">{ownedCategories.length}</span>
          </h3>
          <div className="profile-cat-list">
            {ownedCategories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/category/${cat.slug}`} 
                className="profile-cat-card"
              >
                <span className="profile-cat-icon">{cat.icon || '📁'}</span>
                <span className="profile-cat-name">{cat.name}</span>
                {cat.venue_count !== undefined && (
                  <span className="profile-cat-venues">{cat.venue_count} venues</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasModerated && (
        <div className="profile-cat-section">
          <h3 className="profile-cat-title">
            Categories Moderated
            <span className="profile-cat-count">{moderatedCategories.length}</span>
          </h3>
          <div className="profile-cat-list">
            {moderatedCategories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/category/${cat.slug}`} 
                className="profile-cat-card"
              >
                <span className="profile-cat-icon">{cat.icon || '📁'}</span>
                <span className="profile-cat-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STATS TAB ───────────────────────────────────────
function StatsTab({ profile }) {
  const stats = useMemo(() => {
    if (!profile) return null;

    // Days since joined
    const joinDate = new Date(profile.date_joined);
    const now = new Date();
    const diffTime = Math.abs(now - joinDate);
    const daysJoined = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Contributions per day
    const contribCount = profile.contribution_count || 0;
    const contribsPerDay = (contribCount / daysJoined).toFixed(2);

    // Success rate & favorite category
    let successRate = 0;
    let favoriteCat = null;
    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;

    if (profile.contributions?.length > 0) {
      const catCounts = {};

      profile.contributions.forEach(c => {
        if (c.status === 'approved') approvedCount++;
        else if (c.status === 'rejected') rejectedCount++;
        else if (c.status === 'pending') pendingCount++;

        if (c.category_slug) {
          catCounts[c.category_slug] = (catCounts[c.category_slug] || 0) + 1;
        }
      });

      const totalDecided = approvedCount + rejectedCount;
      if (totalDecided > 0) {
        successRate = Math.round((approvedCount / totalDecided) * 100);
      } else if (approvedCount > 0) {
        successRate = 100;
      }

      // Find favorite category
      let maxCount = 0;
      for (const [cat, count] of Object.entries(catCounts)) {
        if (count > maxCount) {
          maxCount = count;
          favoriteCat = cat;
        }
      }
    }

    // ============ RATING STATS ============
    const ratings = profile.recent_ratings || [];
    const ratingsCount = profile.ratings_given_count || ratings.length;
    const avgRating = profile.average_rating_given;
    
    // Rating distribution & personality
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingsWithComment = 0;
    let mostGivenScore = null;
    let firstRatingDate = null;
    let lastRatingDate = null;
    
    if (ratings.length > 0) {
      ratings.forEach(r => {
        ratingDistribution[r.score] = (ratingDistribution[r.score] || 0) + 1;
        if (r.comment && r.comment.trim()) ratingsWithComment++;
      });
      
      // Most given score
      let maxScoreCount = 0;
      for (const [score, count] of Object.entries(ratingDistribution)) {
        if (count > maxScoreCount) {
          maxScoreCount = count;
          mostGivenScore = parseInt(score);
        }
      }
      
      // First and last rating dates
      const sortedByDate = [...ratings].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      firstRatingDate = sortedByDate[0]?.created_at;
      lastRatingDate = sortedByDate[sortedByDate.length - 1]?.created_at;
    }
    
    // Rating personality
    let ratingPersonality = null;
    if (avgRating) {
      if (avgRating >= 4.2) ratingPersonality = { type: 'generous', label: 'Generous Rater', emoji: '🌟', color: '#27ae60' };
      else if (avgRating <= 2.5) ratingPersonality = { type: 'tough', label: 'Tough Critic', emoji: '🔍', color: '#e74c3c' };
      else if (avgRating >= 2.8 && avgRating <= 3.2) ratingPersonality = { type: 'balanced', label: 'Balanced Judge', emoji: '⚖️', color: '#3498db' };
      else if (avgRating >= 3.5) ratingPersonality = { type: 'positive', label: 'Positive Reviewer', emoji: '👍', color: '#9b59b6' };
      else ratingPersonality = { type: 'critical', label: 'Critical Thinker', emoji: '🤔', color: '#f39c12' };
    }
    
    // Badges
    const badges = [];
    if (ratingsCount >= 100) badges.push({ label: 'Century Reviewer', emoji: '💯', desc: '100+ ratings' });
    else if (ratingsCount >= 50) badges.push({ label: 'Prolific Reviewer', emoji: '📝', desc: '50+ ratings' });
    else if (ratingsCount >= 10) badges.push({ label: 'Active Reviewer', emoji: '✍️', desc: '10+ ratings' });
    
    if (ratingsWithComment >= 10) badges.push({ label: 'Comment Writer', emoji: '💬', desc: 'Leaves detailed feedback' });
    if (ratingDistribution[5] >= 20) badges.push({ label: '5-Star Fan', emoji: '⭐', desc: 'Gave 20+ perfect scores' });
    if (ratingDistribution[1] >= 5) badges.push({ label: 'Honest Critic', emoji: '🎯', desc: 'Not afraid to rate low' });
    if (contribCount >= 50 && ratingsCount >= 20) badges.push({ label: 'Power User', emoji: '⚡', desc: 'Active contributor & reviewer' });
    
    // Ratings per day
    const ratingsPerDay = ratingsCount > 0 && daysJoined > 0 
      ? (ratingsCount / daysJoined).toFixed(2) 
      : '0.00';

    return {
      daysJoined,
      contribsPerDay,
      successRate,
      favoriteCat,
      approvedCount,
      rejectedCount,
      pendingCount,
      totalContributions: contribCount,
      totalVenues: profile.my_venues?.length || 0,
      totalCategories: (profile.owned_categories?.length || 0) + (profile.moderated_categories?.length || 0),
      // Rating stats
      ratingsCount,
      avgRating,
      ratingDistribution,
      ratingsWithComment,
      mostGivenScore,
      ratingPersonality,
      badges,
      ratingsPerDay,
      firstRatingDate,
      lastRatingDate,
    };
  }, [profile]);

  if (!stats) return null;

  return (
    <div className="profile-stats-tab">
      {/* Badges Section */}
      {stats.badges.length > 0 && (
        <>
          <h3 className="profile-section-title">🏆 Badges Earned</h3>
          <div className="profile-badges">
            {stats.badges.map((badge, i) => (
              <div key={i} className="profile-badge">
                <span className="profile-badge-emoji">{badge.emoji}</span>
                <span className="profile-badge-label">{badge.label}</span>
                <span className="profile-badge-desc">{badge.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Activity Overview */}
      <h3 className="profile-section-title">Activity Overview</h3>
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="profile-stat-value">{stats.daysJoined}</div>
          <div className="profile-stat-label">Days on Mapedia</div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-value">{stats.contribsPerDay}</div>
          <div className="profile-stat-label">Contributions / Day</div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-value">{stats.totalContributions}</div>
          <div className="profile-stat-label">Total Contributions</div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-value">{stats.totalVenues}</div>
          <div className="profile-stat-label">Venues Contributed</div>
        </div>
      </div>

      {/* Rating Stats */}
      {stats.ratingsCount > 0 && (
        <>
          <h3 className="profile-section-title" style={{ marginTop: 32 }}>⭐ Rating Stats</h3>
          
          {/* Rating Personality */}
          {stats.ratingPersonality && (
            <div 
              className="profile-personality-card"
              style={{ borderColor: stats.ratingPersonality.color }}
            >
              <span className="profile-personality-emoji">{stats.ratingPersonality.emoji}</span>
              <span 
                className="profile-personality-label"
                style={{ color: stats.ratingPersonality.color }}
              >
                {stats.ratingPersonality.label}
              </span>
              <span className="profile-personality-avg">
                Average rating: {stats.avgRating}★
              </span>
            </div>
          )}
          
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <div className="profile-stat-value">{stats.ratingsCount}</div>
              <div className="profile-stat-label">Total Ratings</div>
            </div>

            <div className="profile-stat-card">
              <div className="profile-stat-value" style={{ color: '#f5a623' }}>
                {stats.avgRating || '—'}★
              </div>
              <div className="profile-stat-label">Average Given</div>
            </div>

            <div className="profile-stat-card">
              <div className="profile-stat-value">{stats.mostGivenScore}★</div>
              <div className="profile-stat-label">Most Given Score</div>
            </div>

            <div className="profile-stat-card">
              <div className="profile-stat-value">{stats.ratingsWithComment}</div>
              <div className="profile-stat-label">With Comments</div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="profile-rating-distribution">
            <h4>Rating Distribution</h4>
            <div className="distribution-bars">
              {[5, 4, 3, 2, 1].map(score => {
                const count = stats.ratingDistribution[score] || 0;
                const percentage = stats.ratingsCount > 0 ? (count / stats.ratingsCount) * 100 : 0;
                return (
                  <div key={score} className="distribution-row">
                    <span className="distribution-label">{score}★</span>
                    <div className="distribution-bar">
                      <div 
                        className="distribution-fill" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="distribution-count">{count}</span>
                    <span className="distribution-percent">({percentage.toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rating Activity */}
          <div className="profile-stats-grid" style={{ marginTop: 16 }}>
            <div className="profile-stat-card">
              <div className="profile-stat-value">{stats.ratingsPerDay}</div>
              <div className="profile-stat-label">Ratings / Day</div>
            </div>
            
            {stats.firstRatingDate && (
              <div className="profile-stat-card">
                <div className="profile-stat-value" style={{ fontSize: 16 }}>
                  {new Date(stats.firstRatingDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </div>
                <div className="profile-stat-label">First Rating</div>
              </div>
            )}
            
            {stats.lastRatingDate && (
              <div className="profile-stat-card">
                <div className="profile-stat-value" style={{ fontSize: 16 }}>
                  {new Date(stats.lastRatingDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </div>
                <div className="profile-stat-label">Last Rating</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Contribution Breakdown */}
      {stats.totalContributions > 0 && (
        <>
          <h3 className="profile-section-title" style={{ marginTop: 32 }}>Contribution Breakdown</h3>
          
          <div className="profile-stats-grid">
            <div className="profile-stat-card profile-stat-approved">
              <div className="profile-stat-value">{stats.approvedCount}</div>
              <div className="profile-stat-label">Approved</div>
            </div>

            <div className="profile-stat-card profile-stat-pending">
              <div className="profile-stat-value">{stats.pendingCount}</div>
              <div className="profile-stat-label">Pending</div>
            </div>

            <div className="profile-stat-card profile-stat-rejected">
              <div className="profile-stat-value">{stats.rejectedCount}</div>
              <div className="profile-stat-label">Rejected</div>
            </div>

            <div className="profile-stat-card">
              <div 
                className="profile-stat-value"
                style={{ color: stats.successRate >= 70 ? '#27ae60' : stats.successRate >= 50 ? '#f39c12' : '#e74c3c' }}
              >
                {stats.successRate}%
              </div>
              <div className="profile-stat-label">Approval Rate</div>
            </div>
          </div>
        </>
      )}

      {stats.favoriteCat && (
        <>
          <h3 className="profile-section-title" style={{ marginTop: 32 }}>Favorite Category</h3>
          <Link to={`/category/${stats.favoriteCat}`} className="profile-favorite-cat">
            <span className="profile-favorite-cat-name">
              {stats.favoriteCat.replace(/-/g, ' ')}
            </span>
            <span className="profile-favorite-cat-hint">Most active in this category</span>
          </Link>
        </>
      )}
    </div>
  );
}

// ─── MAIN PROFILE PAGE ───────────────────────────────────────
function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('access');
  const myUsername = localStorage.getItem('username');

  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState('contributions');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnProfile = !username || username === myUsername;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username && !token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        const endpoint = username ? `/users/${username}/` : '/auth/profile/';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await api.get(endpoint, { headers });
        setProfile(res.data);
        setBio(res.data.bio || '');
        
        // Fetch ratings
        const ratingsEndpoint = username 
          ? `/users/${username}/ratings/` 
          : '/my-ratings/';
        
        try {
          const ratingsRes = await api.get(ratingsEndpoint, { headers });
          setRatings(ratingsRes.data.results || []);
        } catch (err) {
          console.log('Ratings fetch error:', err);
          setRatings([]);
        }
        
      } catch (err) {
        console.error("Profil çekilirken hata oluştu:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          localStorage.removeItem('username');
          navigate('/login');
        } else if (err.response?.status === 404) {
          navigate('/404');
        } else {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, token, navigate]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('bio', bio);
      if (avatar) {
        formData.append('avatar', avatar);
      }

      const res = await api.patch('/auth/profile/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      setProfile(prev => ({ ...prev, ...res.data, bio }));
      setSuccess(true);
      setEditing(false);
      setAvatar(null);
    } catch (err) {
      console.error('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/auth/delete-account/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.clear();
      navigate('/');
    } catch (err) {
      console.error('Delete error:', err);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <Navbar />
        <div className="profile-loading">Profile not found</div>
      </div>
    );
  }

  const avatarUrl = profile.avatar
    ? (profile.avatar.startsWith('http') ? profile.avatar : `https://mapedia.org${profile.avatar}`)
    : null;

  return (
    <div>
      <Navbar />
      <main className="profile-main">
        <div className="profile-layout">
          {/* SIDEBAR */}
          <aside className="profile-sidebar">
            <div className="profile-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {profile.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            <h1 className="profile-username">{profile.username}</h1>
            {profile.role && <p className="profile-role">{profile.role}</p>}

            <div className="profile-quick-stats">
              <div className="profile-quick-stat">
                <span className="profile-quick-stat-number">{profile.contribution_count || 0}</span>
                <span className="profile-quick-stat-label">Contributions</span>
              </div>
              <div className="profile-quick-stat">
                <span className="profile-quick-stat-number">{profile.ratings_given_count || ratings.length || 0}</span>
                <span className="profile-quick-stat-label">Ratings</span>
              </div>
              <div className="profile-quick-stat">
                <span className="profile-quick-stat-number">{profile.my_venues?.length || 0}</span>
                <span className="profile-quick-stat-label">Venues</span>
              </div>
            </div>

            {/* Average Rating Given */}
            {profile.average_rating_given && (
              <div className="profile-avg-rating">
                <span className="profile-avg-rating-value">{profile.average_rating_given}★</span>
                <span className="profile-avg-rating-label">avg rating given</span>
              </div>
            )}

            {profile.is_trusted && (
              <div className="profile-trusted">✓ Trusted Contributor</div>
            )}

            <div className="profile-info">
              <table className="profile-info-table">
                <tbody>
                  {isOwnProfile && profile.email && (
                    <tr>
                      <td>Email</td>
                      <td>{profile.email}</td>
                    </tr>
                  )}
                  <tr>
                    <td>User ID</td>
                    <td>{profile.id}</td>
                  </tr>
                  <tr>
                    <td>Joined</td>
                    <td>{new Date(profile.date_joined).toLocaleDateString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {profile.bio && !editing && (
              <p className="profile-bio">{profile.bio}</p>
            )}

            {isOwnProfile && !editing && (
              <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            )}

            {editing && isOwnProfile && (
              <div className="profile-edit-form">
                <div className="profile-field">
                  <label>Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
                <div className="profile-field">
                  <label>Avatar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatar(e.target.files[0])}
                  />
                </div>
                <div className="profile-edit-actions">
                  <button 
                    className="profile-save-btn" 
                    onClick={handleSave} 
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    className="profile-cancel-btn" 
                    onClick={() => { setEditing(false); setBio(profile.bio || ''); setAvatar(null); }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
                {success && <p className="profile-success">Profile updated!</p>}
              </div>
            )}

            {isOwnProfile && (
              <div className="profile-danger-zone">
                {!showDeleteConfirm ? (
                  <button
                    className="profile-delete-btn"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="profile-delete-confirm">
                    <p>Are you sure? This cannot be undone.</p>
                    <div className="profile-delete-actions">
                      <button
                        className="profile-delete-confirm-btn"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Yes, delete'}
                      </button>
                      <button
                        className="profile-delete-cancel-btn"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* MAIN CONTENT */}
          <div className="profile-content">
            <div className="profile-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`profile-tab ${activeTab === tab.key ? 'profile-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  {tab.key === 'contributions' && profile.contributions?.length > 0 && (
                    <span className="profile-tab-count">{profile.contributions.length}</span>
                  )}
                  {tab.key === 'ratings' && (profile.ratings_given_count || ratings.length) > 0 && (
                    <span className="profile-tab-count">{profile.ratings_given_count || ratings.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="profile-tab-content">
              {activeTab === 'contributions' && (
                <ContributionsTab contributions={profile.contributions} />
              )}

              {activeTab === 'venues' && (
                <VenuesTab venues={profile.my_venues} />
              )}

              {activeTab === 'ratings' && (
                <RatingsTab 
                  ratings={ratings} 
                  username={profile.username}
                  isOwnProfile={isOwnProfile}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesTab
                  ownedCategories={profile.owned_categories}
                  moderatedCategories={profile.moderated_categories}
                />
              )}

              {activeTab === 'stats' && (
                <StatsTab profile={{ ...profile, recent_ratings: ratings }} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;