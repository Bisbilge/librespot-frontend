// CommunityGuidelinesPage.jsx
import Navbar from '../components/Navbar'
import '../styles/HomePage.css'
import { Link } from 'react-router-dom'

function CommunityGuidelinesPage() {
  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <h1>Community Guidelines</h1>
        <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 32 }}>Last updated: February 28, 2026</p>

        <p>
          Mapedia is built on the assumption that people contributing to it are doing so in good faith.
          These guidelines exist not to restrict participation, but to protect the accuracy and integrity
          of the data that everyone depends on.
        </p>

        <h2>1. Accuracy First</h2>
        <p>
          Only contribute information you have direct knowledge of or can verify. Do not guess,
          approximate, or copy from other sources without attribution. Inaccurate data is worse
          than no data — it misleads people who rely on it.
        </p>

        <h2>2. No Fabrication</h2>
        <p>
          Do not submit false, invented, or deliberately misleading place information. This includes
          fake venues, incorrect coordinates, and fabricated field values. Accounts found doing this
          will be suspended.
        </p>

        <h2>3. No Spam or Self-Promotion</h2>
        <p>
          Mapedia is not an advertising platform. Do not use contributions to promote businesses,
          services, or websites. Do not create duplicate entries for the same place. Do not submit
          content designed to game rankings or visibility.
        </p>

        <h2>4. Respect Privacy</h2>
        <p>
          Do not submit personal data about individuals — names, contact details, daily routines,
          or any information that could be used to identify or locate a private person.
          Access codes, door codes, or security information that could compromise the safety
          of a private property or its occupants must not be submitted.
        </p>

        <h2>5. No Harmful Content</h2>
        <p>
          Do not submit content that is illegal, threatening, harassing, discriminatory, or
          promotes hatred toward any group. This includes venue descriptions, field values,
          and any free-text contributions.
        </p>

        <h2>6. Vandalism</h2>
        <p>
          Do not deliberately damage existing data — this includes overwriting accurate information
          with false data, blanking fields, or corrupting records. All changes are logged.
          Vandalism will result in immediate account suspension.
        </p>

        <h2>7. Respect the Moderation Process</h2>
        <p>
          Contributions are reviewed by category moderators before publication. If your contribution
          is rejected, the moderator may leave a note explaining why. Do not resubmit rejected
          content without addressing the issue. Do not attempt to pressure or circumvent moderators.
        </p>

        <h2>8. Sensitive Information</h2>
        <p>
          Some categories on Mapedia collect sensitive practical data — accessibility details,
          entry procedures, infrastructure availability. This data should be submitted and used
          to help people, not to exploit or harm. Use your judgment. If something feels wrong
          to share, it probably is.
        </p>

        <h2>9. Enforcement</h2>
        <p>
          Mapedia reserves the right to remove any content and suspend or terminate any account
          that violates these guidelines, with or without prior notice. Decisions are made by
          category moderators and the platform operator.
        </p>
        <p>
          If you believe a moderation decision was made in error, contact us at{' '}
          <a href="mailto:info@mapedia.org">info@mapedia.org</a>.
        </p>

        <h2>10. The Standard</h2>
        <p>
          The question to ask before submitting anything: <em>would I want this in a permanent
          public record that anyone can read and reuse?</em> If yes, submit it. If not, don't.
        </p>

        <p style={{ marginTop: 48, fontSize: 13, color: 'var(--text-light)', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
          These guidelines are part of our <Link to="/terms">Terms of Service</Link>.
          Questions: <a href="mailto:info@mapedia.org">info@mapedia.org</a>
        </p>
      </main>
    </div>
  )
}

export default CommunityGuidelinesPage