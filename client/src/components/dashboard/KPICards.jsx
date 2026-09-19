import { Activity, AlertTriangle, Users, Clock, Bell, CheckCircle2 } from 'lucide-react';

const KPICard = ({ icon: Icon, label, value, color = 'var(--accent-primary)', suffix = '' }) => (
  <div style={styles.card}>
    <div style={{ ...styles.iconWrapper, background: `${color}20`, color }}>
      <Icon size={20} />
    </div>
    <div>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>
        {value}
        {suffix && <span style={styles.suffix}>{suffix}</span>}
      </div>
    </div>
  </div>
);

const KPICards = ({ data }) => {
  if (!data) return null;

  return (
    <div style={styles.grid}>
      <KPICard
        icon={Activity}
        label="Active Incidents"
        value={data.activeIncidents || 0}
        color="var(--accent-primary)"
      />
      <KPICard
        icon={AlertTriangle}
        label="Critical"
        value={data.criticalIncidents || 0}
        color="var(--severity-critical)"
      />
      <KPICard
        icon={Bell}
        label="Pending Alerts"
        value={data.pendingAlerts || 0}
        color="var(--accent-warning)"
      />
      <KPICard
        icon={Users}
        label="Resources Deployed"
        value={data.resourcesDeployed || 0}
        color="var(--accent-success)"
      />
      <KPICard
        icon={Clock}
        label="Avg Response"
        value={data.avgResponseTimeMinutes || 0}
        suffix=" min"
        color="var(--severity-info)"
      />
      <KPICard
        icon={CheckCircle2}
        label="Resolved Today"
        value={data.resolvedToday || 0}
        color="var(--status-resolved)"
      />
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 'var(--space-3)',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
  },
  iconWrapper: {
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 500,
  },
  value: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  suffix: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginLeft: '2px',
    fontWeight: 400,
  },
};

export default KPICards;