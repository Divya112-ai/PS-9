import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@ps9.local' },
  { label: 'Operator', email: 'operator@ps9.local' },
  { label: 'Responder', email: 'responder1@ps9.local' },
  { label: 'Citizen', email: 'citizen@ps9.local' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      // Route based on role
      if (user.role === 'responder') {
        navigate('/responder', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.brandBlock}>
          <div style={styles.logo}>🚨</div>
          <h1 style={styles.brandTitle}>PS-9</h1>
          <p style={styles.brandSubtitle}>
            Intelligent Emergency Response<br />& Resource Coordination Platform
          </p>

          <div style={styles.featureList}>
            <div style={styles.feature}>
              <span style={styles.featureDot} /> AI-powered incident classification
            </div>
            <div style={styles.feature}>
              <span style={styles.featureDot} /> Real-time resource dispatch
            </div>
            <div style={styles.feature}>
              <span style={styles.featureDot} /> Duplicate detection & merge
            </div>
            <div style={styles.feature}>
              <span style={styles.featureDot} /> Live command center dashboard
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <Card padding="lg" style={styles.card}>
          <h2 style={styles.title}>Sign in</h2>
          <p style={styles.subtitle}>Emergency Operations Center access</p>

          {error && (
            <div style={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-4)' }}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@ps9.local"
              autoComplete="email"
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              <LogIn size={18} /> Sign In
            </Button>
          </form>

          <div style={styles.demoSection}>
            <p style={styles.demoLabel}>Demo accounts (click to auto-fill):</p>
            <div style={styles.demoGrid}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoLogin(acc.email)}
                  style={styles.demoBtn}
                >
                  {acc.label}
                </button>
              ))}
            </div>
            <p style={styles.demoHint}>
              All demo accounts use password: <code style={styles.code}>password123</code>
            </p>
          </div>

          <div style={styles.footer}>
            <Link to="/report" style={styles.reportLink}>
              Need to report an emergency? →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    minHeight: '100vh',
    background: 'var(--bg-base)',
  },
  leftPanel: {
    background: 'linear-gradient(135deg, #0a0f1e 0%, #1e293b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12)',
    borderRight: '1px solid var(--border-subtle)',
  },
  brandBlock: {
    maxWidth: '420px',
  },
  logo: {
    fontSize: '56px',
    marginBottom: 'var(--space-4)',
  },
  brandTitle: {
    fontSize: '42px',
    fontWeight: 800,
    letterSpacing: '4px',
    color: 'var(--accent-primary)',
    marginBottom: 'var(--space-2)',
  },
  brandSubtitle: {
    fontSize: '18px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: 'var(--space-8)',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  featureDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    display: 'inline-block',
  },
  rightPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12)',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: 'var(--space-1)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  errorBanner: {
    marginTop: 'var(--space-4)',
    padding: 'var(--space-3)',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--accent-danger)',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  demoSection: {
    marginTop: 'var(--space-6)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--border-subtle)',
  },
  demoLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-2)',
  },
  demoBtn: {
    padding: 'var(--space-2)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  demoHint: {
    marginTop: 'var(--space-3)',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  code: {
    fontFamily: 'var(--font-mono)',
    background: 'var(--bg-elevated)',
    padding: '1px 6px',
    borderRadius: '4px',
    color: 'var(--accent-primary)',
  },
  footer: {
    marginTop: 'var(--space-6)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--border-subtle)',
    textAlign: 'center',
  },
  reportLink: {
    fontSize: '14px',
    color: 'var(--accent-primary)',
    fontWeight: 500,
  },
};