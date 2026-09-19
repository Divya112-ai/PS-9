import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, AlertTriangle, LayoutDashboard, List, Users, Bell, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocketConnection } from '../../hooks/useSocket';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['operator', 'admin'] },
  { to: '/incidents', label: 'Incidents', icon: List, roles: ['operator', 'admin'] },
  { to: '/resources', label: 'Resources', icon: Users, roles: ['operator', 'admin'] },
  { to: '/alerts', label: 'Alerts', icon: Bell, roles: ['operator', 'admin'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['operator', 'admin'] },
  { to: '/report', label: 'Report Emergency', icon: AlertTriangle, roles: ['citizen', 'operator', 'admin'] },
  { to: '/responder', label: 'My Assignments', icon: FileText, roles: ['responder'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Connect to Socket.IO when layout mounts (user is authenticated)
  useSocketConnection();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <div style={styles.container}>
      {/* ─── Sidebar ─── */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🚨</span>
          <span style={styles.brandText}>PS-9</span>
        </div>

        <nav style={styles.nav}>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : {}),
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ─── Main area ─── */}
      <div style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>
              {visibleNav.find((i) => i.to === location.pathname)?.label || 'PS-9'}
            </h1>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user?.name}</span>
              <span style={styles.userRole}>{user?.role}</span>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
}

// ─── Inline styles ───
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    background: 'var(--bg-base)',
  },
  sidebar: {
    width: 'var(--sidebar-width)',
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-4) 0',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: '0 var(--space-4) var(--space-6)',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: 'var(--space-4)',
  },
  brandIcon: { fontSize: '24px' },
  brandText: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '2px',
    color: 'var(--accent-primary)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    padding: '0 var(--space-2)',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'background 0.15s',
  },
  navItemActive: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    height: 'var(--header-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--space-6)',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  headerLeft: { display: 'flex', alignItems: 'center' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 'var(--space-4)' },
  pageTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    lineHeight: 1.2,
  },
  userName: { fontSize: '14px', fontWeight: 500 },
  userRole: {
    fontSize: '11px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
  },
  logoutBtn: {
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)',
    transition: 'all 0.15s',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--space-6)',
  },
};