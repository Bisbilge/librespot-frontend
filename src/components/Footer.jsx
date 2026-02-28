// src/components/Footer.jsx
import { Link } from 'react-router-dom'
import '../styles/Footer.css'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-license">
          <span>All place data on Mapedia is open data, freely available under </span>
          <a 
            href="https://creativecommons.org/licenses/by-sa/4.0/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            CC BY-SA 4.0
          </a>
        </div>
        
        <nav className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/guidelines">Guidelines</Link>
          <Link to="/license">License</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="mailto:info@mapedia.org">Contact</a>
        </nav>

        <div className="footer-copy">
          © {new Date().getFullYear()} Mapedia — The Free Encyclopedia of Places
        </div>
      </div>
    </footer>
  )
}

export default Footer