import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ProfilePage.css'

const TABS = [
  { key: 'contributions', label: 'My Contributions' },
  { key: 'venues', label: 'My Venues' },
  { key: 'categories', label: 'My Categories' },
]

function ProfilePage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('access')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('contributions')

  useEffect(function () {
    if (!token) {
      navigate('/login')
      return
    }
    api.get('/auth/profile/', {
      headers: { Authorization: 'Bearer ' + token }
    }).then(function (res) {
      setProfile(res.data)
      setBio(res.data.bio || '')
      setLoading(false)
    }).catch(function () {
      navigate('/login')
    })
  }, [])

  function handleSave() {
    setSaving(true)
    setSuccess(false)
    const formData = new FormData()
    formData.append('bio', bio)
    if (avatar) {
      formData.append('avatar', avatar)
    }
    api.patch('/auth/profile/', formData, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/form-data',
      }
    }).then(function () {
      setSuccess(true)
      setEditing(false)
      setSaving(false)
      setProfile(function (prev) {
        return Object.assign({}, prev, { bio: bio })
      })
    }).catch(function () {
      setSaving(false)
    })
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="profile-loading">Loading...</div>
      </div>
    )
  }

  const avatarUrl = profile.avatar
    ? (profile.avatar.startsWith('http') ? profile.avatar : 'https://mapedia.org' + profile.avatar)
    : null

  return (
    <div>
      <Navbar />
      <main className="profile-main">
        <div className="profile-layout">

          {/* SOL SIDEBAR */}
          <aside className="profile-sidebar">
            <div className="profile-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {profile.username ? profile.username[0].toUpperCase() : '?'}
                </div>
              )}
            </div>

            <h1 className="profile-username">{profile.username}</h1>
            <p className="profile-role">{profile.role}</p>

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-number">{profile.contribution_count}</span>
                <span className="profile-stat-label">Contributions</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-number">{profile.my_venues?.length || 0}</span>
                <span className="profile-stat-label">Venues</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-number">{(profile.owned_categories?.length || 0) + (profile.moderated_categories?.length || 0)}</span>
                <span className="profile-stat-label">Categories</span>
              </div>
            </div>

            {profile.is_trusted && (
              <div className="profile-trusted">✓ Trusted Contributor</div>
            )}

            <div className="profile-info">
              <table className="profile-info-table">
                <tbody>
                  <tr>
                    <td>Email</td>
                    <td>{profile.email}</td>
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

            <button
              className="profile-edit-btn"
              onClick={function () { setEditing(!editing) }}
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>

            {editing && (
              <div className="profile-edit-form">
                <div className="auth-field">
                  <label>Bio</label>
                  <textarea
                    value={bio}
                    onChange={function (e) { setBio(e.target.value) }}
                    className="report-textarea"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="auth-field">
                  <label>Avatar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={function (e) { setAvatar(e.target.files[0]) }}
                  />
                </div>
                <button className="auth-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {success && <p className="profile-success">Profile updated.</p>}
              </div>
            )}
          </aside>

          {/* SAĞ İÇERİK */}
          <div className="profile-content">

            {/* Tabs */}
            <div className="profile-tabs">
              {TABS.map(function (tab) {
                return (
                  <button
                    key={tab.key}
                    className={'profile-tab' + (activeTab === tab.key ? ' profile-tab-active' : '')}
                    onClick={function () { setActiveTab(tab.key) }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Contributions Tab */}
            {activeTab === 'contributions' && (
              <div>
                {profile.contributions.length === 0 ? (
                  <p className="profile-empty">No contributions yet.</p>
                ) : (
                  <table className="profile-contributions-table">
                    <thead>
                      <tr>
                        <th>Venue</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.contributions.map(function (c) {
                        return (
                          <tr key={c.id}>
                            <td>
                              {c.venue_id ? (
                                <Link to={'/venue/' + c.venue_id}>{c.name}</Link>
                              ) : (
                                <span>{c.name}</span>
                              )}
                            </td>
                            <td className="contrib-type">{c.type.replace('_', ' ')}</td>
                            <td>
                              <span className={'contrib-status contrib-status-' + c.status}>
                                {c.status}
                              </span>
                            </td>
                            <td className="contrib-date">
                              {new Date(c.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Venues Tab */}
            {activeTab === 'venues' && (
              <div>
                {(!profile.my_venues || profile.my_venues.length === 0) ? (
                  <p className="profile-empty">No approved venues yet.</p>
                ) : (
                  <div className="profile-venues-grid">
                    {profile.my_venues.map(function (v) {
                      return (
                        <Link key={v.id} to={'/venue/' + v.id} className="profile-venue-card">
                          <span className="profile-venue-name">{v.name}</span>
                          <span className="profile-venue-meta">
                            {[v.city, v.country].filter(Boolean).join(', ')}
                          </span>
                          <span className="profile-venue-category">{v.category_name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div>
                {profile.owned_categories?.length > 0 && (
                  <div className="profile-cat-section">
                    <h3 className="profile-cat-title">Categories I Own</h3>
                    <div className="profile-cat-list">
                      {profile.owned_categories.map(function (cat) {
                        return (
                          <div key={cat.id} className="profile-cat-card">
                            <Link to={'/category/' + cat.slug} className="profile-cat-name">
                              {cat.name}
                            </Link>
                            <Link to={'/moderation/' + cat.slug} className="profile-cat-manage">
                              Manage →
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {profile.moderated_categories?.length > 0 && (
                  <div className="profile-cat-section">
                    <h3 className="profile-cat-title">Categories I Moderate</h3>
                    <div className="profile-cat-list">
                      {profile.moderated_categories.map(function (cat) {
                        return (
                          <div key={cat.id} className="profile-cat-card">
                            <Link to={'/category/' + cat.slug} className="profile-cat-name">
                              {cat.name}
                            </Link>
                            <Link to={'/moderation/' + cat.slug} className="profile-cat-manage">
                              Moderate →
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {(!profile.owned_categories?.length && !profile.moderated_categories?.length) && (
                  <p className="profile-empty">No categories yet.</p>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage