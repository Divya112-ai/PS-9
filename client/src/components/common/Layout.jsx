import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, AlertTriangle, LayoutDashboard, List,
  Users, Bell, BarChart3, FileText, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocketConnection } from '../../hooks/useSocket';
import ConnectionStatus from './ConnectionStatus';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['operator', 'admin'] },
  { to: '/incidents', label: 'Incidents', icon: List, roles: ['operator', 'admin'] },
  { to: '/resources', label: 'Resources', icon: Users, roles: ['operator', 'admin'] },
  { to: '/alerts', label: 'Alerts', icon: Bell, roles: ['operator', 'admin'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['operator', 'admin'] },
  { to: '/report', label: 'Report Emergency', icon: AlertTriangle, roles: ['citizen', 'operator', 'admin'] },
  { to: '/responder', label: 'My Assignments', icon: FileText, roles: ['responder'] },
];

const ROLE_COLORS = {
  admin: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  operator: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  responder: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  citizen: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useSocketConnection();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const roleStyle = ROLE_COLORS[user?.role] || { color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };

  return (
    <div style={styles.container}>
      {/* ─── Sidebar ─── */}
      <aside style={styles.sidebar}>
        {/* Brand */}
        <div style={styles.brand}>
          <span style={styles.brandDot} />
          <span style={styles.brandText}>PS-9</span>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : {}),
                }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
                {active && <span style={styles.activePip} />}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User block */}
        <div style={styles.userBlock}>
          <div style={styles.userAvatar}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={{ ...styles.userRole, color: roleStyle.color, background: roleStyle.bg }}>
              {user?.role}
            </span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <Shield size={16} color="var(--text-dim)" />
            <h1 style={styles.pageTitle}>
              {visibleNav.find((i) => location.pathname.startsWith(i.to))?.label || 'PS-9'}
            </h1>
          </div>

          <div style={styles.headerRight}>
            <ConnectionStatus />
          </div>
        </header>

        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    background: 'var(--bg-base)',
    overflow: 'hidden',
  },
  sidebar: {
    width: '220px',
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 var(--space-4)',
    overflow: 'hidden',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '20px var(--space-5)',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: 'var(--space-3)',
  },
  brandDot: {
    display: 'inline-block',
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    boxShadow: '0 0 7px var(--accent-primary)',
    flexShrink: 0,
  },
  brandText: {
    fontSize: '17px',
    fontWeight: 800,
    letterSpacing: '3px',
    color: 'var(--text-primary)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0 var(--space-2)',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'background 0.12s, color 0.12s',
    position: 'relative',
    overflow: 'hidden',
  },
  navItemActive: {
    background: 'rgba(59,130,246,0.1)',
    color: '#60a5fa',
  },
  activePip: {
    position: 'absolute',
    right: '10px',
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#60a5fa',
  },

  // User block at bottom
  userBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: 'var(--space-3) var(--space-3)',
    margin: '0 var(--space-2)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
  },
  userAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  userName: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userRole: {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '1px 6px',
    borderRadius: '999px',
    display: 'inline-block',
    width: 'fit-content',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-dim)',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    borderRadius: '6px',
    transition: 'color 0.12s',
    flexShrink: 0,
  },

  // Main
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  header: {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--space-6)',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  pageTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '-0.2px',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    padding: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
  },
};
