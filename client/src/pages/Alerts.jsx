import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Bell, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { alertAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import { useToast } from '../components/common/Toast';
import { timeAgo, formatDateTime } from '../utils/formatters';

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  warning: Bell,
  info: Info,
};

const SEVERITY_COLORS = {
  critical: 'critical',
  warning: 'medium',
  info: 'info',
};

const Alerts = () => {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    try {
      const params = filter === 'all' ? {} : { acknowledged: 'false' };
      const { data } = await alertAPI.list(params);
      setAlerts(data.data.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useSocketEvent('alert:created', (alert) => {
    setAlerts((prev) => {
      if (prev.find((a) => a._id === alert._id)) return prev;
      return [alert, ...prev];
    });
  });

  const handleAcknowledge = async (alertId) => {
    try {
      await alertAPI.acknowledge(alertId);
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === alertId
            ? { ...a, acknowledged: true, acknowledgedAt: new Date() }
            : a
        )
      );
      showToast('Alert acknowledged', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Acknowledge failed', 'error');
    }
  };

  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  if (loading) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={20} className="spin" />
        <span>Loading alerts…</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ─── Header ─── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Alert Feed</h1>
          <p style={styles.subtitle}>
            {activeCount} active · {alerts.length} total
          </p>
        </div>
        <div style={styles.filterRow}>
          {['active', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                ...(filter === f ? styles.filterBtnActive : {}),
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ─── List ─── */}
      {alerts.length === 0 ? (
        <Card padding="lg" style={styles.emptyCard}>
          <CheckCircle2 size={48} color="var(--accent-success)" />
          <h3 style={styles.emptyTitle}>All clear</h3>
          <p style={styles.emptyText}>
            No {filter === 'active' ? 'pending ' : ''}alerts right now. The system
            will notify you if anything requires attention.
          </p>
        </Card>
      ) : (
        <div style={styles.list}>
          {alerts.map((alert) => {
            const Icon = SEVERITY_ICONS[alert.severity] || Info;
            const colorVar = alert.severity === 'critical'
              ? 'var(--severity-critical)'
              : alert.severity === 'warning'
              ? 'var(--accent-warning)'
              : 'var(--severity-info)';

            return (
              <div
                key={alert._id}
                style={{
                  ...styles.alertCard,
                  borderLeftColor: colorVar,
                  opacity: alert.acknowledged ? 0.55 : 1,
                }}
              >
                <div style={styles.alertContent}>
                  <div style={styles.alertTop}>
                    <div style={{ ...styles.iconWrapper, color: colorVar }}>
                      <Icon size={18} />
                    </div>
                    <div style={styles.alertBody}>
                      <div style={styles.alertMeta}>
                        <Badge color={SEVERITY_COLORS[alert.severity]} size="sm">
                          {alert.severity}
                        </Badge>
                        {alert.incidentId?.publicId && (
                          <span style={styles.incidentTag}>
                            {alert.incidentId.publicId}
                          </span>
                        )}
                        <span style={styles.alertTime}>
                          {timeAgo(alert.createdAt)}
                        </span>
                      </div>
                      <p style={styles.alertMessage}>{alert.message}</p>
                      {alert.acknowledged && alert.acknowledgedAt && (
                        <p style={styles.ackInfo}>
                          Acknowledged {formatDateTime(alert.acknowledgedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {!alert.acknowledged && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAcknowledge(alert._id)}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    maxWidth: '960px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-12)',
    color: 'var(--text-muted)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: 'var(--space-1)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  filterRow: { display: 'flex', gap: '4px' },
  filterBtn: {
    fontSize: '11px',
    padding: '4px 12px',
    background: 'transparent',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    textTransform: 'capitalize',
    fontWeight: 500,
  },
  filterBtnActive: {
    background: 'var(--accent-primary)',
    color: '#fff',
    borderColor: 'var(--accent-primary)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  alertCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    padding: 'var(--space-4)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderLeft: '3px solid',
    borderRadius: 'var(--radius-lg)',
  },
  alertContent: { flex: 1, display: 'flex' },
  alertTop: { display: 'flex', gap: 'var(--space-3)', flex: 1 },
  iconWrapper: {
    padding: 'var(--space-2)',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)',
    height: 'fit-content',
  },
  alertBody: { flex: 1 },
  alertMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-2)',
  },
  incidentTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
    padding: '2px 6px',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-sm)',
  },
  alertTime: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginLeft: 'auto',
  },
  alertMessage: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  },
  ackInfo: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: 'var(--space-1)',
  },
  emptyCard: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-12)',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    maxWidth: '400px',
  },
};

export default Alerts;