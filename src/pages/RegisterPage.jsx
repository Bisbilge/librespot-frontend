import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/AuthPage.css'

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(function(prev) {
      return { ...prev, [e.target.name]: e.target.value }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    api.post('/auth/register/', form)
      .then(function() {
        navigate('/login')
      })
      .catch(function(err) {
        setErrors(err.response?.data || {})
        setLoading(false)
      })
  }

  return (
    <div>
      <Navbar />
      <main className="auth-main">
        <div className="auth-box">
          <h1 className="auth-title">Create an account</h1>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
              {errors.username && <span className="auth-field-error">{errors.username}</span>}
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                name="password2"
                value={form.password2}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default RegisterPage