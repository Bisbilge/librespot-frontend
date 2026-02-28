// AboutPage.jsx
import Navbar from '../components/Navbar'
import '../styles/HomePage.css'
import { Link } from 'react-router-dom'

function AboutPage() {
  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <h1>About Mapedia</h1>

        <h2>The Problem</h2>
        <p>
          Most mapping services treat location data as a proprietary asset. Coordinates, place details,
          and practical information are locked behind commercial interests, shaped by algorithms, and
          made available only on someone else's terms. The data exists — but it isn't free.
        </p>
        <p>
          Mapedia was built in response to this. Not to compete with existing maps, but to occupy
          a different space entirely: the granular, practical knowledge about places that commercial
          platforms have no incentive to collect or share.
        </p>

        <h2>What Mapedia Documents</h2>
        <p>
          A coordinate tells you where a place is. Mapedia tries to answer what it's actually like
          to be there — the entry procedures, the available power outlets, the real accessibility
          situation, the connection quality, the practical micro-details that determine whether a
          place works for you before you arrive.
        </p>
        <p>
          This is not data that scales well through automation. It requires people who have been
          to these places, who noticed, and who chose to share what they found.
        </p>

        <h2>How It Works</h2>
        <p>
          Mapedia is built around community-owned categories. Any user can propose a new category
          of places, define what data should be collected for it, and take responsibility for
          moderating contributions. There is no central editorial authority deciding what matters.
          The platform provides the structure; the community provides the knowledge.
        </p>
        <p>
          Contributions go through a moderation layer before they are published — not to gatekeep,
          but to maintain the accuracy that makes the data useful. Trusted contributors can bypass
          this step once they've established a track record.
        </p>

        <h2>Open Data</h2>
        <p>
          Every piece of data on Mapedia is published under the{' '}
          <strong>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</strong>{' '}
          license. This is not a courtesy — it is a structural commitment.
        </p>
        <p>
          It means the data belongs to no one and to everyone. It can be downloaded, reused,
          built upon, and redistributed freely, as long as the same freedom is preserved downstream.
          No data on Mapedia can be taken and made proprietary. The license enforces this
          automatically.
        </p>
        <p>
          Mapedia does not sell data. It does not monetize access. The infrastructure exists
          to keep the data available and the contribution process open.
        </p>

        <h2>Infrastructure</h2>
        <p>
          Mapedia runs on a single server hosted by Hetzner Online GmbH in Germany, within the
          European Union. It is maintained by one person. There is no company, no investors,
          and no roadmap driven by growth metrics. The goal is a reliable, honest, and permanent
          public record of places — nothing more.
        </p>

        <h2>Participate</h2>
        <p>
          The platform is only as useful as its data. If you know a place well enough to document
          it accurately, that knowledge has a home here.
        </p>
        <p>
          <Link to="/register">Create an account</Link> to start contributing, or browse existing
          categories to see what's already been mapped.
        </p>

        <p style={{ marginTop: 48, fontSize: 13, color: 'var(--text-light)', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
          Questions or feedback: <a href="mailto:info@mapedia.org">info@mapedia.org</a>
        </p>
      </main>
    </div>
  )
}

export default AboutPage