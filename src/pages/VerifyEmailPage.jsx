import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ContributePage.css'

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found.')
      return
    }
    api.get(`/auth/verify-email/?token=${token}`)
      .then(res => {
        setStatus('success')
        setMessage(res.data.detail)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'Verification failed.')
      })
  }, [token])

  return (
    <div>
      <Navbar />
      <main className="contribute-main">
        <div className="contribute-box">
          {status === 'loading' && (
            <p style={{ color: 'var(--text-light)' }}>Verifying your email…</p>
          )}
          {status === 'success' && (
            <>
              <h1 className="contribute-title">✓ Email Verified</h1>
              <p>{message}</p>
              <div style={{ marginTop: 20 }}>
                <Link to="/login" className="auth-btn">Log in</Link>
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="contribute-title">Verification Failed</h1>
              <p style={{ color: '#c00' }}>{message}</p>
              <div style={{ marginTop: 20 }}>
                <Link to="/" className="auth-btn">Go to Home</Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default VerifyEmailPage