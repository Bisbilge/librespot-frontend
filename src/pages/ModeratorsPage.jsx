import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ModeratorsPage.css'

function ModeratorsPage() {
  const { categorySlug } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('access')
  const [moderators, setModerators] = useState([])
  const [newUserId, setNewUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(function() {
    if (!token) {
      navigate('/login')
      return
    }
    loadModerators()
  }, [categorySlug])

  function loadModerators() {
    api.get('/categories/' + categorySlug + '/moderators/', {
      headers: { Authorization: 'Bearer ' + token }
    }).then(function(res) {
      setModerators(res.data)
      setLoading(false)
    }).catch(function(err) {
      if (err.response && err.response.status === 403) {
        navigate('/moderation')
      }
      setLoading(false)
    })
  }

  function handleAdd() {
    setError('')
    setSuccess('')
    if (!newUserId.trim()) return

    api.post('/categories/' + categorySlug + '/moderators/add/', {
      user_id: newUserId
    }, {
      headers: { Authorization: 'Bearer ' + token }
    }).then(function(res) {
      setSuccess(res.data.username + ' added as moderator.')
      setNewUserId('')
      loadModerators()
    }).catch(function(err) {
      setError(err.response ? JSON.stringify(err.response.data) : 'Error.')
    })
  }

  function handleRemove(userId, username) {
    setError('')
    setSuccess('')
    api.post('/categories/' + categorySlug + '/moderators/remove/', {
      user_id: userId
    }, {
      headers: { Authorization: 'Bearer ' + token }
    }).then(function() {
      setSuccess(username + ' removed.')
      loadModerators()
    }).catch(function(err) {
      setError(err.response ? JSON.stringify(err.response.data) : 'Error.')
    })
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="mods-loading">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <main className="mods-main">
        <div className="mods-box">
          <div className="mods-breadcrumb">
            <Link to="/moderation">Moderation</Link>
            <span> / </span>
            <Link to={'/moderation/' + categorySlug}>{categorySlug}</Link>
            <span> / </span>
            <span>Manage Moderators</span>
          </div>

          <h1 className="mods-title">Manage Moderators</h1>
          <p className="mods-desc">Category: <strong>{categorySlug}</strong></p>

          {error && <div className="mods-error">{error}</div>}
          {success && <div className="mods-success">{success}</div>}

          <div className="mods-section">
            <h2>Current Moderators</h2>
            {moderators.length === 0 ? (
              <p className="mods-empty">No moderators yet.</p>
            ) : (
              <ul className="mods-list">
                {moderators.map(function(mod) {
                  return (
                    <li key={mod.id} className="mods-list-item">
                      <span className="mods-username">{mod.username}</span>
                      <span className="mods-user-id">ID: {mod.id}</span>
                      <button
                        className="mods-remove-btn"
                        onClick={function() { handleRemove(mod.id, mod.username) }}
                      >
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="mods-section">
            <h2>Add Moderator</h2>
            <p className="mods-hint">Enter the user ID of the person you want to add.</p>
            <div className="mods-add-row">
              <input
                type="number"
                placeholder="User ID"
                value={newUserId}
                onChange={function(e) { setNewUserId(e.target.value) }}
                className="mods-input"
              />
              <button onClick={handleAdd} className="mods-add-btn">Add</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ModeratorsPage