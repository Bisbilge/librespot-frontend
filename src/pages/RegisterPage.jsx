import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ContributePage.css'

function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    api.post('/auth/register/', { username, email, password, password2: confirmPassword })
      .then(() => {
        setEmailSent(true)
        setLoading(false)
      })
      .catch(err => {
        const data = err.response?.data
        setError(data ? Object.values(data).flat().join(' ') : 'Registration failed.')
        setLoading(false)
      })
  }

  if (emailSent) {
    return (
      <div>
        <Navbar />
        <main className="contribute-main">
          <div className="contribute-box">
            <h1 className="contribute-title">Check your email</h1>
            <p>
              We sent a verification link to <strong>{email}</strong>.
              Please click the link to activate your account.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 12 }}>
              Didn't receive it? Check your spam folder.
            </p>
            <div style={{ marginTop: 24 }}>
              <Link to="/" className="auth-btn">Go to Home</Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <main className="contribute-main">
        <div className="contribute-box">
          <h1 className="contribute-title">Create an account</h1>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="contribute-form">
            <div className="auth-field">
              <label>Username *</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Password *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ fontSize: 13, marginTop: 16 }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default RegisterPage