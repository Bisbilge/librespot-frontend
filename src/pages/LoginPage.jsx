import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/AuthPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    api.post('/auth/login/', { username, password })
      .then(function(res) {
        localStorage.setItem('access', res.data.access)
        localStorage.setItem('refresh', res.data.refresh)
        navigate('/')
      })
      .catch(function() {
        setError('Invalid username or password.')
        setLoading(false)
      })
  }

  return (
    <div>
      <Navbar />
      <main className="auth-main">
        <div className="auth-box">
          <h1 className="auth-title">Log in to LibreSpot</h1>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={function(e) { setUsername(e.target.value) }}
                required
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={function(e) { setPassword(e.target.value) }}
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <p className="auth-switch">
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage