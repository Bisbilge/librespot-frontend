// OpenDataLicensePage.jsx
import Navbar from '../components/Navbar'
import '../styles/HomePage.css'
import { Link } from 'react-router-dom'

function OpenDataLicensePage() {
  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <h1>Open Data License</h1>

        <p>
          All place data contributed to and published by Mapedia is released under the{' '}
          <strong>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</strong>{' '}
          license.
        </p>

        <h2>What This Means</h2>
        <p>
          You are free to:
        </p>
        <ul>
          <li><strong>Use</strong> — download, access, and use Mapedia data for any purpose, including commercial use</li>
          <li><strong>Share</strong> — copy and redistribute the data in any format or medium</li>
          <li><strong>Adapt</strong> — transform, build upon, and integrate the data into your own projects</li>
        </ul>

        <p>Under the following conditions:</p>
        <ul>
          <li><strong>Attribution</strong> — you must give appropriate credit to Mapedia and its contributors</li>
          <li><strong>ShareAlike</strong> — if you build upon or redistribute this data, you must do so under the same CC BY-SA 4.0 license</li>
        </ul>

        <h2>Why CC BY-SA 4.0</h2>
        <p>
          This license was chosen deliberately. The ShareAlike condition means that Mapedia data
          cannot be taken, modified, and made proprietary. Any derivative work must remain open
          under the same terms. This protects the data commons that contributors are building together.
        </p>
        <p>
          It is the same license used by Wikipedia and OpenStreetMap — projects that have demonstrated
          that open, community-maintained data can be more accurate, more comprehensive, and more
          durable than proprietary alternatives.
        </p>

        <h2>How to Attribute</h2>
        <p>When using Mapedia data, attribution should include:</p>
        <ul>
          <li>The name <strong>Mapedia</strong> with a link to <strong>mapedia.org</strong></li>
          <li>A reference to the CC BY-SA 4.0 license with a link to{' '}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
              creativecommons.org/licenses/by-sa/4.0
            </a>
          </li>
        </ul>
        <p>Example attribution:</p>
        <blockquote style={{
          borderLeft: '3px solid var(--border)',
          paddingLeft: 16,
          margin: '16px 0',
          fontSize: 14,
          color: 'var(--text-light)'
        }}>
          Data from <a href="https://mapedia.org">Mapedia</a>, licensed under{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
            CC BY-SA 4.0
          </a>.
        </blockquote>

        <h2>What Is Not Covered</h2>
        <p>
          This license applies to the place data contributed by users. It does not apply to
          Mapedia's source code, interface design, or branding. User account information and
          personal data are governed by the <Link to="/privacy">Privacy Policy</Link>, not this license.
        </p>

        <h2>Accessing the Data</h2>
        <p>
          Mapedia data is accessible via the public API. All approved venue data can be retrieved
          without authentication. For bulk data access or integration questions, contact{' '}
          <a href="mailto:info@mapedia.org">info@mapedia.org</a>.
        </p>

        <p style={{ marginTop: 48, fontSize: 13, color: 'var(--text-light)', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
          Full license text:{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
            creativecommons.org/licenses/by-sa/4.0
          </a>
        </p>
      </main>
    </div>
  )
}

export default OpenDataLicensePage