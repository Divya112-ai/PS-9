import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_HOME = {
  citizen: '/my-reports',
  responder: '/responder',
  operator: '/dashboard',
  admin: '/dashboard',
};

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={s.loader}>
        <span style={s.spinner} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = ROLE_HOME[user.role] || '/';
    return (
      <div style={s.denied}>
        <ShieldOff size={40} color="var(--text-dim)" />
        <h2 style={s.deniedTitle}>Access Denied</h2>
        <p style={s.deniedText}>
          Your account role <strong style={{ color: 'var(--text-secondary)' }}>({user.role})</strong> can't access this page.
        </p>
        <Link to={home} style={s.homeBtn}>Go to my home →</Link>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

const s = {
  loader: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-base)',
  },
  spinner: {
    display: 'inline-block',
    width: '28px',
    height: '28px',
    border: '3px solid var(--border-default)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  denied: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    background: 'var(--bg-base)',
    textAlign: 'center',
    padding: '24px',
  },
  deniedTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  deniedText: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    maxWidth: '320px',
    lineHeight: 1.6,
  },
  homeBtn: {
    marginTop: '8px',
    fontSize: '14px',
    color: 'var(--accent-primary)',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
