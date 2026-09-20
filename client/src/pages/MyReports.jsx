import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, MapPin, Clock, RefreshCw,
  CheckCircle2, AlertTriangle, Zap, Plus, LogOut, User
} from 'lucide-react';
import { incidentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  reported:   { label: 'Reported',   color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  classified: { label: 'Classified', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  assigned:   { label: 'Assigned',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  en_route:   { label: 'En Route',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  on_scene:   { label: 'On Scene',   color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  resolved:   { label: 'Resolved',   color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  closed:     { label: 'Closed',     color: '#475569', bg: 'rgba(71,85,105,0.12)' },
  merged:     { label: 'Merged',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const SEVERITY_COLOR = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
};

const STEPS = ['reported', 'classified', 'assigned', 'en_route', 'on_scene', 'resolved'];

function StatusTimeline({ status }) {
  const activeIdx = STEPS.indexOf(status);
  return (
    <div style={s.timeline}>
      {STEPS.map((step, i) => {
        const done = i <= activeIdx;
        const active = i === activeIdx;
        const cfg = STATUS_CONFIG[step] || {};
        return (
          <div key={step} style={s.timelineStep}>
            <div style={{
              ...s.timelineDot,
              background: done ? cfg.color : 'var(--bg-elevated)',
              border: `2px solid ${done ? cfg.color : 'var(--border-default)'}`,
              boxShadow: active ? `0 0 8px ${cfg.color}88` : 'none',
            }} />
            <span style={{
              ...s.timelineLabel,
              color: done ? cfg.color : 'var(--text-dim)',
              fontWeight: active ? 600 : 400,
            }}>
              {cfg.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ ...s.timelineLine, background: done && i < activeIdx ? cfg.color : 'var(--border-subtle)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReportCard({ report, expanded, onToggle }) {
  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.reported;
  const sevColor = SEVERITY_COLOR[report.severity] || 'var(--text-muted)';

  return (
    <div style={s.card} onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onToggle()}>
      <div style={s.cardTop}>
        <div style={s.cardLeft}>
          <div style={s.cardId}>{report.publicId}</div>
          <div style={s.cardDesc}>{report.description}</div>
          {report.address && (
            <div style={s.cardAddr}>
              <MapPin size={12} />
              {report.address}
            </div>
          )}
        </div>
        <div style={s.cardRight}>
          <span style={{ ...s.statusBadge, color: statusCfg.color, background: statusCfg.bg }}>
            {statusCfg.label}
          </span>
          <span style={{ ...s.severityBadge, color: sevColor }}>
            {report.severity?.toUpperCase()} · {report.priority}
          </span>
          <span style={s.timeAgo}>
            <Clock size={11} />
            {formatAgo(report.createdAt)}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={s.cardExpanded}>
          <StatusTimeline status={report.status} />

          <div style={s.detailGrid}>
            <DetailRow label="Incident type" value={report.type} capitalize />
            <DetailRow label="AI confidence" value={report.ai?.classified ? `${(report.ai.confidence * 100).toFixed(0)}%` : '—'} />
            {report.ai?.summary && <DetailRow label="AI summary" value={report.ai.summary} />}
            {report.assignedResources?.length > 0 && (
              <DetailRow label="Assigned units" value={report.assignedResources.map(r => r.publicId || r).join(', ')} />
            )}
            {report.resolvedAt && <DetailRow label="Resolved at" value={new Date(report.resolvedAt).toLocaleString()} />}
          </div>

          {report.status !== 'resolved' && report.status !== 'closed' && report.status !== 'merged' && (
            <div style={s.activeNote}>
              <Zap size={13} color="#f59e0b" />
              <span>Our team is working on this. You'll see this card update as things progress.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, capitalize }) {
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={{ ...s.detailValue, textTransform: capitalize ? 'capitalize' : 'none' }}>{value}</span>
    </div>
  );
}

function formatAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MyReports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const { data } = await incidentAPI.myReports();
      setReports(data.data.incidents || []);
    } catch (err) {
      setError('Could not load your reports. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <Link to="/" style={s.headerBrand}>
          <span style={s.headerDot} />
          <span style={s.headerLogo}>PS-9</span>
        </Link>
        <div style={s.headerRight}>
          <Link to="/report" style={s.reportBtn}>
            <Plus size={14} /> New Report
          </Link>
          <div style={s.userChip}>
            <User size={14} />
            <span>{user?.name}</span>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.container}>
          {/* Page title */}
          <div style={s.titleRow}>
            <div>
              <h1 style={s.pageTitle}>
                <ClipboardList size={22} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--accent-primary)' }} />
                My Reports
              </h1>
              <p style={s.pageSub}>Track every emergency report you've submitted — live status updates.</p>
            </div>
            <button
              style={s.refreshBtn}
              onClick={() => load(true)}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div style={s.center}>
              <span style={s.bigSpinner} />
              <p style={s.loadingText}>Loading your reports…</p>
            </div>
          ) : error ? (
            <div style={s.errorBox}>
              <AlertTriangle size={20} color="var(--accent-danger)" />
              <span>{error}</span>
              <button style={s.retryBtn} onClick={() => load()}>Retry</button>
            </div>
          ) : reports.length === 0 ? (
            <div style={s.empty}>
              <ClipboardList size={48} color="var(--text-dim)" />
              <h3 style={s.emptyTitle}>No reports yet</h3>
              <p style={s.emptyText}>When you submit an emergency report it will appear here.</p>
              <Link to="/report" style={s.emptyBtn}>
                <Plus size={16} /> Submit a report
              </Link>
            </div>
          ) : (
            <div style={s.list}>
              {reports.map((r) => (
                <ReportCard
                  key={r._id}
                  report={r}
                  expanded={expandedId === r._id}
                  onToggle={() => setExpandedId(expandedId === r._id ? null : r._id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--space-6)',
    height: '60px',
    background: 'rgba(10,15,30,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  headerDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    boxShadow: '0 0 6px var(--accent-primary)',
  },
  headerLogo: {
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '3px',
    color: 'var(--text-primary)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  reportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    background: 'rgba(220,38,38,0.1)',
    border: '1px solid rgba(220,38,38,0.3)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    padding: '6px 10px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    padding: '6px',
    borderRadius: '8px',
    transition: 'color 0.15s',
  },

  main: {
    flex: 1,
    padding: 'var(--space-8) var(--space-4)',
  },
  container: {
    maxWidth: '780px',
    margin: '0 auto',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    marginBottom: '6px',
  },
  pageSub: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '8px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    flexShrink: 0,
  },

  // Cards
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '14px',
    padding: '20px 22px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    outline: 'none',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
  },
  cardId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--accent-primary)',
    letterSpacing: '1px',
    marginBottom: '6px',
  },
  cardDesc: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    marginBottom: '6px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardAddr: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
    flexShrink: 0,
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.3px',
  },
  severityBadge: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  timeAgo: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--text-dim)',
  },

  // Expanded
  cardExpanded: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-subtle)',
  },
  timeline: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0',
    marginBottom: '20px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  timelineStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
    minWidth: '60px',
  },
  timelineDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginBottom: '6px',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  timelineLine: {
    position: 'absolute',
    top: '5px',
    left: '50%',
    width: '100%',
    height: '2px',
    transition: 'background 0.2s',
  },
  timelineLabel: {
    fontSize: '10px',
    textAlign: 'center',
    letterSpacing: '0.3px',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'var(--bg-base)',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '14px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    gap: '16px',
  },
  detailLabel: {
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  detailValue: {
    color: 'var(--text-primary)',
    fontWeight: 500,
    textAlign: 'right',
  },
  activeNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(245,158,11,0.06)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },

  // States
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '80px 0',
  },
  bigSpinner: {
    display: 'inline-block',
    width: '32px',
    height: '32px',
    border: '3px solid var(--border-default)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'rgba(220,38,38,0.06)',
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: '10px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  retryBtn: {
    marginLeft: 'auto',
    padding: '6px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    cursor: 'pointer',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '80px 0',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    maxWidth: '320px',
  },
  emptyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    padding: '10px 20px',
    background: 'var(--accent-primary)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    borderRadius: '8px',
    textDecoration: 'none',
  },
};
