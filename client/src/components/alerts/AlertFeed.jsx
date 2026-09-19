import { AlertTriangle, Bell, Info } from 'lucide-react';
import Badge from '../common/Badge';
import { timeAgo } from '../../utils/formatters';

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  warning: Bell,
  info: Info,
};

const AlertFeed = ({ alerts, onAcknowledge }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>No active alerts</p>
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {alerts.map((alert) => {
        const Icon = SEVERITY_ICONS[alert.severity] || Info;
        const isCritical = alert.severity === 'critical';
        const isAck = alert.acknowledged;

        return (
          <div
            key={alert._id}
            style={{
              ...styles.alert,
              opacity: isAck ? 0.5 : 1,
              borderLeftColor: isCritical ? 'var(--severity-critical)' : alert.severity === 'warning' ? 'var(--accent-warning)' : 'var(--severity-info)',
            }}
          >
            <div style={styles.alertHeader}>
              <div style={styles.alertIcon}>
                <Icon size={14} />
              </div>
              <span style={styles.alertTime}>{timeAgo(alert.createdAt)}</span>
              {!isAck && (
                <button
                  onClick={() => onAcknowledge?.(alert._id)}
                  style={styles.ackBtn}
                >
                  Ack
                </button>
              )}
            </div>
            <p style={styles.alertMsg}>{alert.message}</p>
            {alert.incidentId?.publicId && (
              <div style={styles.alertIncident}>
                <Badge color="default" size="sm">{alert.incidentId.publicId}</Badge>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  alert: {
    padding: 'var(--space-3)',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)',
    borderLeft: '3px solid',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-1)',
  },
  alertIcon: {
    color: 'var(--text-muted)',
    display: 'flex',
  },
  alertTime: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    flex: 1,
  },
  ackBtn: {
    fontSize: '10px',
    padding: '2px 8px',
    background: 'var(--bg-base)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 600,
  },
  alertMsg: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  alertIncident: {
    marginTop: 'var(--space-1)',
  },
  empty: {
    padding: 'var(--space-6)',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
};

export default AlertFeed;