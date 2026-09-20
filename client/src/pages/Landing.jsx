import { Link } from 'react-router-dom';
import {
  Shield, Zap, Radio, Map, BarChart2, Users,
  ArrowRight, ChevronRight, AlertTriangle, Clock, CheckCircle2
} from 'lucide-react';

const STATS = [
  { value: '< 3 min', label: 'Avg. dispatch time' },
  { value: '98.2%', label: 'Uptime SLA' },
  { value: 'Real-time', label: 'Incident tracking' },
  { value: 'AI-powered', label: 'Classification' },
];

const FEATURES = [
  {
    icon: Zap,
    color: '#f59e0b',
    title: 'AI Incident Classification',
    desc: 'Every report is analyzed and classified in under a second. Type, severity, and priority are auto-assigned so operators respond faster.',
  },
  {
    icon: Radio,
    color: '#3b82f6',
    title: 'Live Command Center',
    desc: 'Real-time socket updates across all connected operators. When a resource moves, every screen updates instantly.',
  },
  {
    icon: Map,
    color: '#10b981',
    title: 'Geospatial Dispatch',
    desc: 'The nearest available units are surfaced automatically. Duplicate reports from the same location are detected and merged.',
  },
  {
    icon: BarChart2,
    color: '#8b5cf6',
    title: 'Analytics & Hotspots',
    desc: 'Trend charts, response time breakdowns, and geographic hotspot maps let leadership act on data, not gut feel.',
  },
  {
    icon: Users,
    color: '#ec4899',
    title: 'Role-Based Access',
    desc: 'Citizens report. Responders get assignments. Operators manage the full picture. Admins control everything.',
  },
  {
    icon: Shield,
    color: '#06b6d4',
    title: 'Escalation & Alerts',
    desc: 'Incidents that go unassigned trigger automatic escalation alerts. Nothing slips through the cracks.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Citizen reports an emergency',
    desc: 'Anyone can submit a report — no login required. Geolocation pins the exact spot.',
    icon: AlertTriangle,
    color: '#f59e0b',
  },
  {
    step: '02',
    title: 'AI classifies and prioritizes',
    desc: 'Gemini AI reads the description and assigns incident type, severity (low→critical), and a P1–P4 priority.',
    icon: Zap,
    color: '#3b82f6',
  },
  {
    step: '03',
    title: 'Operator dispatches resources',
    desc: 'The nearest available unit is recommended. One click assigns and notifies the responder in real time.',
    icon: Radio,
    color: '#10b981',
  },
  {
    step: '04',
    title: 'You track it live',
    desc: 'Your tracking ID shows you exactly where your report is — from "Reported" all the way to "Resolved".',
    icon: CheckCircle2,
    color: '#8b5cf6',
  },
];

export default function Landing() {
  return (
    <div style={s.root}>
      {/* ── Nav ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.brand}>
            <span style={s.brandDot} />
            <span style={s.brandText}>Rakshak AI</span>
          </div>
          <div style={s.navLinks}>
            <a href="#how-it-works" style={s.navLink}>How it works</a>
            <a href="#features" style={s.navLink}>Features</a>
            <Link to="/report" style={s.navReport}>
              Report Emergency
            </Link>
            <Link to="/login" style={s.navLogin}>Sign in</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={s.hero}>
        <div style={s.heroBadge}>
          <span style={s.heroBadgeDot} />
          Live incident monitoring active
        </div>

        <h1 style={s.heroTitle}>
          Emergency Response,<br />
          <span style={s.heroAccent}>Redesigned.</span>
        </h1>

        <p style={s.heroSub}>
          PS-9 is an AI-powered emergency coordination platform. Citizens report,
          operators dispatch, responders act — all connected, all in real time.
        </p>

        <div style={s.heroCta}>
          <Link to="/report" style={s.ctaPrimary}>
            Report an Emergency
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" style={s.ctaSecondary}>
            Operator Login
            <ChevronRight size={16} />
          </Link>
        </div>

        <div style={s.statsRow}>
          {STATS.map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statValue}>{st.value}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={s.section}>
        <div style={s.sectionInner}>
          <p style={s.sectionEyebrow}>How it works</p>
          <h2 style={s.sectionTitle}>From report to resolution</h2>
          <p style={s.sectionSub}>Four steps. Under four minutes.</p>

          <div style={s.stepsGrid}>
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} style={s.stepCard}>
                  <div style={{ ...s.stepNum, color: item.color }}>{item.step}</div>
                  <div style={{ ...s.stepIconWrap, background: item.color + '18', border: `1px solid ${item.color}33` }}>
                    <Icon size={22} color={item.color} />
                  </div>
                  <h3 style={s.stepTitle}>{item.title}</h3>
                  <p style={s.stepDesc}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ ...s.section, background: 'var(--bg-surface)' }}>
        <div style={s.sectionInner}>
          <p style={s.sectionEyebrow}>Platform capabilities</p>
          <h2 style={s.sectionTitle}>Built for the people responding to crises</h2>
          <p style={s.sectionSub}>
            Every feature exists for one reason: faster, smarter emergency response.
          </p>

          <div style={s.featuresGrid}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={s.featureCard}>
                  <div style={{ ...s.featureIcon, background: f.color + '18', border: `1px solid ${f.color}33` }}>
                    <Icon size={20} color={f.color} />
                  </div>
                  <h3 style={s.featureTitle}>{f.title}</h3>
                  <p style={s.featureDesc}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section style={s.ctaStrip}>
        <div style={s.ctaStripInner}>
          <div>
            <h2 style={s.ctaStripTitle}>Are you a citizen?</h2>
            <p style={s.ctaStripSub}>
              Register to track every complaint you submit — live status updates, assigned responder, estimated arrival.
            </p>
          </div>
          <div style={s.ctaStripBtns}>
            <Link to="/login?tab=register" style={s.ctaPrimary}>
              Create an account
              <ArrowRight size={18} />
            </Link>
            <Link to="/report" style={s.ctaOutline}>
              Report without account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.brand}>
            <span style={s.brandDot} />
            <span style={s.brandText}>PS-9</span>
          </div>
          <p style={s.footerNote}>
            For real emergencies always call your local emergency number — 112 in India.
          </p>
        </div>
      </footer>
    </div>
  );
}

const s = {
  root: {
    background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    minHeight: '100vh',
    fontFamily: 'var(--font-sans)',
  },

  // Nav
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid var(--border-subtle)',
    background: 'rgba(10,15,30,0.92)',
    backdropFilter: 'blur(12px)',
  },
  navInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 var(--space-6)',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-6)',
  },
  navLink: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  navReport: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#f87171',
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid rgba(248,113,113,0.3)',
    background: 'rgba(248,113,113,0.08)',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  navLogin: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-elevated)',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },

  // Brand
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    boxShadow: '0 0 8px var(--accent-primary)',
  },
  brandText: {
    fontSize: '20px',
    fontWeight: 800,
    letterSpacing: '3px',
    color: 'var(--text-primary)',
  },

  // Hero
  hero: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '100px var(--space-6) 80px',
    textAlign: 'center',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#4ade80',
    padding: '5px 14px',
    borderRadius: '999px',
    border: '1px solid rgba(74,222,128,0.3)',
    background: 'rgba(74,222,128,0.08)',
    marginBottom: '32px',
    letterSpacing: '0.3px',
  },
  heroBadgeDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#4ade80',
    animation: 'pulse 2s infinite',
  },
  heroTitle: {
    fontSize: 'clamp(40px, 6vw, 72px)',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-1.5px',
    marginBottom: '24px',
    color: 'var(--text-primary)',
  },
  heroAccent: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSub: {
    fontSize: '18px',
    color: 'var(--text-muted)',
    lineHeight: 1.7,
    maxWidth: '600px',
    margin: '0 auto 40px',
  },
  heroCta: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '64px',
  },
  ctaPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    background: 'var(--accent-primary)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '15px',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'all 0.15s',
    boxShadow: '0 0 24px rgba(59,130,246,0.35)',
  },
  ctaSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    background: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: '15px',
    borderRadius: '10px',
    border: '1px solid var(--border-default)',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  ctaOutline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontWeight: 500,
    fontSize: '14px',
    borderRadius: '10px',
    border: '1px solid var(--border-default)',
    textDecoration: 'none',
  },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px',
    background: 'var(--border-subtle)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    overflow: 'hidden',
    maxWidth: '720px',
    margin: '0 auto',
  },
  statCard: {
    background: 'var(--bg-surface)',
    padding: '28px 16px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
    letterSpacing: '-0.5px',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Sections
  section: {
    padding: '96px 0',
  },
  sectionInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 var(--space-6)',
  },
  sectionEyebrow: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: 'var(--accent-primary)',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 4vw, 42px)',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  sectionSub: {
    fontSize: '16px',
    color: 'var(--text-muted)',
    marginBottom: '56px',
  },

  // Steps
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
  },
  stepCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    padding: '32px 24px',
    transition: 'border-color 0.2s, transform 0.2s',
  },
  stepNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '2px',
    marginBottom: '16px',
    opacity: 0.9,
  },
  stepIconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  stepTitle: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '10px',
    color: 'var(--text-primary)',
  },
  stepDesc: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },

  // Features
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  featureCard: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    padding: '28px 24px',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  featureIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '15px',
    fontWeight: 700,
    marginBottom: '10px',
    color: 'var(--text-primary)',
  },
  featureDesc: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    lineHeight: 1.65,
  },

  // CTA strip
  ctaStrip: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderTop: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '64px 0',
  },
  ctaStripInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 var(--space-6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '48px',
    flexWrap: 'wrap',
  },
  ctaStripTitle: {
    fontSize: '28px',
    fontWeight: 800,
    marginBottom: '10px',
    letterSpacing: '-0.5px',
  },
  ctaStripSub: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    maxWidth: '520px',
  },
  ctaStripBtns: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },

  // Footer
  footer: {
    borderTop: '1px solid var(--border-subtle)',
    padding: '32px 0',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 var(--space-6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    flexWrap: 'wrap',
  },
  footerNote: {
    fontSize: '13px',
    color: 'var(--text-dim)',
  },
};
