// TermsPage.jsx
import Navbar from '../components/Navbar'
import '../styles/HomePage.css'
import { Link } from 'react-router-dom'

function TermsPage() {
  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <h1>Terms of Service</h1>
        <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 32 }}>Last updated: February 28, 2026</p>

        <p>By creating an account or contributing to Mapedia, you agree to these Terms of Service. Please read them carefully.</p>

        <h2>1. About Mapedia</h2>
        <p>Mapedia is an open data platform for places and cultural venues, operated by <strong>Bilge Kaan Yazıcı</strong> (Istanbul, Türkiye). The platform allows users to add, edit, and explore place information collaboratively.</p>

        <h2>2. Eligibility</h2>
        <p>You must be at least 16 years old to use Mapedia. By creating an account, you confirm that you meet this requirement.</p>

        <h2>3. Your Account</h2>
        <ul>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You must provide a valid email address and verify it to activate your account.</li>
          <li>You may not create accounts for others without their consent.</li>
          <li>You may delete your account at any time through the platform.</li>
        </ul>

        <h2>4. Content and Contributions</h2>
        <p>All content you submit to Mapedia is published under the <strong>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</strong> license. This means your contributions are freely available to anyone to use, share, and adapt, provided attribution is given and derivative works are shared under the same license.</p>
        <p>By submitting content, you confirm that you have the right to contribute it and that it does not infringe any third-party rights. When you delete your account, your personal data is removed. However, your contributions may be retained in anonymized form to preserve the integrity of the public dataset.</p>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Submit false, misleading, or fabricated place information</li>
          <li>Upload content that is illegal, harmful, defamatory, or infringes intellectual property rights</li>
          <li>Attempt to gain unauthorized access to the platform or other users' accounts</li>
          <li>Use automated tools to scrape or abuse the platform in ways that degrade service for others</li>
          <li>Harass, impersonate, or harm other users or contributors</li>
        </ul>
        <p>Mapedia reserves the right to remove content or suspend accounts that violate these terms.</p>

        <h2>6. Content Moderation</h2>
        <p>Mapedia operates a community moderation system. Category owners and moderators review contributions before they are published. Mapedia reserves the right to reject or remove any content, with or without notice.</p>

        <h2>7. Open Data</h2>
        <p>The place data published on Mapedia is made available as open data under CC BY-SA 4.0. You are free to use, share, and build upon this data provided you give appropriate credit and distribute derivative works under the same license.</p>

        <h2>8. Data Accuracy</h2>
        <p>Mapedia does not guarantee the accuracy or completeness of place information contributed by users. All data is community-contributed and may contain errors or outdated information. Use of this data is at your own discretion.</p>

        <h2>9. Service Availability</h2>
        <p>Mapedia is provided "as-is" by an independent developer. While we aim to keep the platform available and reliable, we do not guarantee uninterrupted access or preservation of data. We are not liable for any loss or damage arising from use of the platform.</p>

        <h2>10. Privacy</h2>
        <p>Your use of Mapedia is also governed by our <Link to="/privacy">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>

        <h2>11. Governing Law</h2>
        <p>These Terms are governed by the laws of the Republic of Türkiye. Any disputes arising from these Terms shall be subject to the jurisdiction of Turkish courts.</p>

        <h2>12. Changes to These Terms</h2>
        <p>If significant changes are made to these Terms, registered users will be notified by email. Continued use of the platform after changes constitutes acceptance of the updated Terms.</p>

        <h2>13. Contact</h2>
        <p>Bilge Kaan Yazıcı — <a href="mailto:info@mapedia.org">info@mapedia.org</a></p>
      </main>
    </div>
  )
}

export default TermsPage