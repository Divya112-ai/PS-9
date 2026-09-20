import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'citizen', label: 'Citizen — report & track emergencies' },
  { value: 'responder', label: 'Responder — receive field assignments' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  // Read ?tab=register from URL
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab] = useState(initialTab);

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPwd, setLoginPwd] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regRole, setRegRole] = useState('citizen');
  const [regOrg, setRegOrg] = useState('');

  const from = location.state?.from?.pathname || null;

  useEffect(() => {
    setError('');
  }, [tab]);

  const redirectUser = (user) => {
    if (from) { navigate(from, { replace: true }); return; }
    if (user.role === 'responder') navigate('/responder', { replace: true });
    else if (user.role === 'citizen') navigate('/my-reports', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPwd) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPwd);
      redirectUser(user);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Cannot reach the server. Make sure the backend is running on port 5000.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regName || !regEmail || !regPwd) { setError('Name, email, and password are required'); return; }
    if (regPwd.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register({ name: regName, email: regEmail, password: regPwd, role: regRole, organization: regOrg || undefined });
      redirectUser(user);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Cannot reach the server. Make sure the backend is running on port 5000.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <Link to="/" style={s.backLink}>
          <ArrowLeft size={15} /> Back to home
        </Link>

        <div style={s.leftContent}>
          <div style={s.logoRow}>
            <span style={s.logoDot} />
            <span style={s.logoText}>PS-9</span>
          </div>
          <h2 style={s.leftTitle}>Emergency Response Platform</h2>
          <p style={s.leftSub}>
            Join thousands of citizens and responders coordinating emergency response across the region.
          </p>

          <div style={s.roleCards}>
            <div style={s.roleCard}>
              <span style={s.roleEmoji}>👤</span>
              <div>
                <div style={s.roleTitle}>Citizens</div>
                <div style={s.roleDesc}>Report emergencies and track complaint status live</div>
              </div>
            </div>
            <div style={s.roleCard}>
              <span style={s.roleEmoji}>🚒</span>
              <div>
                <div style={s.roleTitle}>Responders</div>
                <div style={s.roleDesc}>Receive assignments and navigate to incidents</div>
              </div>
            </div>
            <div style={s.roleCard}>
              <span style={s.roleEmoji}>🖥️</span>
              <div>
                <div style={s.roleTitle}>Operators</div>
                <div style={s.roleDesc}>Manage the full command center dashboard</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.formBox}>
          {/* Tabs */}
          <div style={s.tabs}>
            <button
              style={{ ...s.tab, ...(tab === 'login' ? s.tabActive : {}) }}
              onClick={() => setTab('login')}
            >
              Sign In
            </button>
            <button
              style={{ ...s.tab, ...(tab === 'register' ? s.tabActive : {}) }}
              onClick={() => setTab('register')}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div style={s.error}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Email address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={s.input}
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Password</label>
                <div style={s.pwdWrap}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={loginPwd}
                    onChange={(e) => setLoginPwd(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...s.input, paddingRight: '44px' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    style={s.eyeBtn}
                    onClick={() => setShowPwd((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" style={s.submitBtn} disabled={loading}>
                {loading ? (
                  <span style={s.spinner} />
                ) : (
                  <>
                    <LogIn size={17} />
                    Sign In
                  </>
                )}
              </button>

              <p style={s.switchHint}>
                Don't have an account?{' '}
                <button type="button" style={s.switchLink} onClick={() => setTab('register')}>
                  Create one
                </button>
              </p>

              {/* Operator accounts note */}
              <div style={s.demoNote}>
                <span style={s.demoNoteLabel}>For demo / testing</span>
                <p style={s.demoNoteText}>
                  Use <code style={s.code}>admin@ps9.local</code> or <code style={s.code}>operator@ps9.local</code> with password <code style={s.code}>password123</code> to explore the command center.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Full name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Arjun Sharma"
                  style={s.input}
                  autoFocus
                  autoComplete="name"
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Email address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={s.input}
                  autoComplete="email"
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Password <span style={s.labelHint}>(min. 6 characters)</span></label>
                <div style={s.pwdWrap}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={regPwd}
                    onChange={(e) => setRegPwd(e.target.value)}
                    placeholder="Choose a strong password"
                    style={{ ...s.input, paddingRight: '44px' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    style={s.eyeBtn}
                    onClick={() => setShowPwd((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>I am a</label>
                <select value={regRole} onChange={(e) => setRegRole(e.target.value)} style={s.select}>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {regRole === 'responder' && (
                <div style={s.field}>
                  <label style={s.label}>Organization <span style={s.labelHint}>(optional)</span></label>
                  <input
                    type="text"
                    value={regOrg}
                    onChange={(e) => setRegOrg(e.target.value)}
                    placeholder="e.g., Ahmedabad Fire Station 4"
                    style={s.input}
                  />
                </div>
              )}

              <button type="submit" style={s.submitBtn} disabled={loading}>
                {loading ? (
                  <span style={s.spinner} />
                ) : (
                  <>
                    <UserPlus size={17} />
                    Create Account
                  </>
                )}
              </button>

              <p style={s.switchHint}>
                Already have an account?{' '}
                <button type="button" style={s.switchLink} onClick={() => setTab('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}

          <div style={s.reportLine}>
            <Link to="/report" style={s.reportLink}>
              ⚠️ Report an emergency without logging in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    minHeight: '100vh',
    background: 'var(--bg-base)',
  },

  // Left
  left: {
    background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-6) var(--space-8)',
    position: 'relative',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    marginBottom: 'auto',
  },
  leftContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingBottom: '48px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '28px',
  },
  logoDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    boxShadow: '0 0 8px var(--accent-primary)',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '3px',
    color: 'var(--text-primary)',
  },
  leftTitle: {
    fontSize: '28px',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.5px',
    marginBottom: '16px',
    color: 'var(--text-primary)',
  },
  leftSub: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    lineHeight: 1.65,
    marginBottom: '40px',
  },
  roleCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  roleCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '16px 18px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px',
  },
  roleEmoji: { fontSize: '20px', marginTop: '1px' },
  roleTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' },
  roleDesc: { fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 },

  // Right
  right: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-8)',
  },
  formBox: {
    width: '100%',
    maxWidth: '420px',
  },

  // Tabs
  tabs: {
    display: 'flex',
    gap: '4px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },

  // Error
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.35)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '13px',
    marginBottom: '20px',
  },

  // Form
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  field: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '7px',
  },
  labelHint: {
    fontSize: '12px',
    color: 'var(--text-dim)',
    fontWeight: 400,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    cursor: 'pointer',
  },
  pwdWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  },

  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    background: 'var(--accent-primary)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '15px',
    borderRadius: '9px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'opacity 0.15s',
  },
  spinner: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  switchHint: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '16px',
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
    fontWeight: 500,
  },

  demoNote: {
    marginTop: '24px',
    padding: '14px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
  },
  demoNoteLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-dim)',
    marginBottom: '6px',
  },
  demoNoteText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  code: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    background: 'var(--bg-elevated)',
    padding: '1px 5px',
    borderRadius: '4px',
    color: 'var(--accent-primary)',
  },

  reportLine: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-subtle)',
    textAlign: 'center',
  },
  reportLink: {
    fontSize: '13px',
    color: '#f87171',
    textDecoration: 'none',
    fontWeight: 500,
  },
};
