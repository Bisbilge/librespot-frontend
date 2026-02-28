// PrivacyPage.jsx
import Navbar from '../components/Navbar'
import '../styles/HomePage.css'

function PrivacyPage() {
  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <h1>Privacy Policy</h1>
        <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 32 }}>Last updated: February 28, 2026</p>

        <p>Mapedia is a community-driven, open data platform for places and cultural venues. This Privacy Policy explains what personal data we collect, why we collect it, and how it is protected and used.</p>

        <h2>1. Data Controller</h2>
        <p><strong>Bilge Kaan Yazıcı</strong><br />Istanbul, Türkiye<br />Contact: <a href="mailto:info@mapedia.org">info@mapedia.org</a></p>
        <p>Mapedia is operated by an independent individual (no registered company at this time).</p>

        <h2>2. Hosting and Data Location</h2>
        <p>Mapedia infrastructure is hosted by <strong>Hetzner Online GmbH (Germany)</strong>, within the European Union. All personal data is processed within the European Economic Area (EEA) and subject to GDPR safeguards.</p>

        <h2>3. Data We Collect</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 16 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 0' }}>Data</th>
              <th style={{ textAlign: 'left', padding: '8px 0' }}>Purpose</th>
              <th style={{ textAlign: 'left', padding: '8px 0' }}>Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 0' }}>Email address</td>
              <td style={{ padding: '8px 0' }}>Account verification and notifications</td>
              <td style={{ padding: '8px 0' }}>Performance of contract — GDPR Art. 6(1)(b)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 0' }}>IP address</td>
              <td style={{ padding: '8px 0' }}>Security and abuse prevention</td>
              <td style={{ padding: '8px 0' }}>Legitimate interest — GDPR Art. 6(1)(f)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 0' }}>Username, bio, avatar</td>
              <td style={{ padding: '8px 0' }}>Profile and contribution attribution</td>
              <td style={{ padding: '8px 0' }}>Consent — GDPR Art. 6(1)(a)</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0' }}>Contribution content</td>
              <td style={{ padding: '8px 0' }}>Creating and maintaining open map data</td>
              <td style={{ padding: '8px 0' }}>Consent — GDPR Art. 6(1)(a)</td>
            </tr>
          </tbody>
        </table>
        <p>Mapedia does not collect precise location data, phone numbers, identity documents, or payment information.</p>

        <h2>4. Open Data and Public Contributions</h2>
        <p>Mapedia is an open knowledge platform. Content you submit (such as place information, descriptions, and edits) may be publicly visible and shared under the <strong>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</strong> license.</p>
        <p>When you delete your account, your personal data (email, profile data) is permanently deleted. Your contributions may be retained in anonymized form to preserve the integrity of the public dataset.</p>

        <h2>5. Third-Party Services</h2>
        <p><strong>Resend</strong> — email delivery (verification and notifications). Only your email address is processed.</p>
        <p><strong>Sentry</strong> — technical error monitoring. Limited diagnostic data may be processed solely for debugging and is not used to identify users.</p>
        <p>No third-party service is used for advertising, profiling, or tracking. Your data is never sold or shared for marketing purposes.</p>

        <h2>6. Data Security</h2>
        <ul>
          <li>All connections are encrypted via HTTPS (SSL/TLS)</li>
          <li>Authentication and cache data are stored in a local Redis instance on the server and never leave the server</li>
          <li>Automated protections against brute-force and unauthorized access</li>
          <li>Automated database backups taken nightly and stored on the server and a secure secondary location within the European Union</li>
        </ul>

        <h2>7. Browser Storage</h2>
        <p>Mapedia does not use advertising or tracking cookies. Authentication tokens are stored in your browser's local storage solely for maintaining your logged-in session. Clearing your browser data or logging out removes this information.</p>

        <h2>8. Data Retention</h2>
        <p>Personal data is retained only while your account is active. When you delete your account, personal identifiers are permanently deleted, avatars and uploaded media are physically removed from storage, and session data is destroyed automatically. Security logs may be retained for a limited period for abuse prevention.</p>

        <h2>9. Your Rights</h2>
        <p>Under the GDPR, you have the right to access, correct, delete, restrict, or port your personal data, and to object to processing based on legitimate interest. You may exercise these rights by emailing <a href="mailto:info@mapedia.org">info@mapedia.org</a> or deleting your account through the platform. Requests are handled within 30 days.</p>

        <h2>10. Eligibility</h2>
        <p>Mapedia is intended for users who are at least 16 years old. By creating an account, you confirm that you meet this requirement.</p>

        <h2>11. Right to Lodge a Complaint</h2>
        <p>You have the right to lodge a complaint with your local data protection authority in your country of residence.</p>

        <h2>12. Policy Updates</h2>
        <p>If significant changes are made to this policy, registered users will be notified by email. The latest version will always be available on this page.</p>

        <h2>13. Contact</h2>
        <p>Bilge Kaan Yazıcı — <a href="mailto:info@mapedia.org">info@mapedia.org</a></p>
      </main>
    </div>
  )
}

export default PrivacyPage