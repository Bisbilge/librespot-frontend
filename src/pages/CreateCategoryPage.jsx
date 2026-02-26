import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/client'
import '../styles/ContributePage.css'

function CreateCategoryPage() {
  const token = localStorage.getItem('access')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
  })

  function handleChange(e) {
    const { name, value } = e.target
    const updates = { [name]: value }
    if (name === 'name' && !form.slug) {
      updates.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }
    setForm(prev => Object.assign({}, prev, updates))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    api.post('/categories/create/', form, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('access') }
    }).then(function(res) {
      navigate('/category/' + res.data.slug)
    }).catch(function(err) {
      setError(JSON.stringify(err.response ? err.response.data : 'An error occurred.'))
      setLoading(false)
    })
  }

  if (!token) {
    return (
      <div>
        <Navbar />
        <main className="contribute-main">
          <div className="contribute-box">
            <h1>Create a Category</h1>
            <p>You need to <Link to="/login">log in</Link> to create a category.</p>
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
          <h1 className="contribute-title">Create a Category</h1>
          <p className="contribute-desc">
            Create a new category and become its owner. You can add field definitions
            and manage moderators after creation.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="contribute-form">
            <div className="auth-field">
              <label>Category Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Public Restrooms"
                required
              />
            </div>

            <div className="auth-field">
              <label>Slug *</label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="e.g. public-restrooms"
                required
              />
              <small style={{ color: '#888' }}>URL-friendly identifier, auto-generated from name.</small>
            </div>

            <div className="auth-field">
              <label>Description</label>
              <textarea
                className="report-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What kind of places does this category cover?"
              />
            </div>

            <div className="auth-field">
              <label>Icon</label>
              <input
                type="text"
                name="icon"
                value={form.icon}
                onChange={handleChange}
                placeholder="e.g. 🚻 or fa-restroom"
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default CreateCategoryPage