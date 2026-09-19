import { MapPin, Clock, CheckCircle2, Truck } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { severityColor, timeAgo, formatStatus } from '../../utils/formatters';

const STATUS_ACTIONS = {
  classified: { next: 'assigned', label: 'Accept Assignment', variant: 'primary', icon: Truck },
  assigned: { next: 'en_route', label: 'Start En Route', variant: 'primary', icon: Truck },
  en_route: { next: 'on_scene', label: 'Arrived On Scene', variant: 'primary', icon: MapPin },
  on_scene: { next: 'resolved', label: 'Resolve Incident', variant: 'success', icon: CheckCircle2 },
};

const AssignmentCard = ({ incident, onStatusChange, loading = false, expanded = false }) => {
  const sevColor = severityColor(incident.severity);
  const action = STATUS_ACTIONS[incident.status];

  return (
    <div style={{ ...styles.card, borderLeftColor: sevColor }}>
      <div style={styles.header}>
        <div style={styles.idRow}>
          <span style={styles.publicId}>{incident.publicId}</span>
          <Badge
            color={
              incident.priority === 'P1' ? 'critical'
              : incident.priority === 'P2' ? 'high'
              : incident.priority === 'P3' ? 'medium'
              : 'low'
            }
          >
            {incident.priority}
          </Badge>
        </div>
        <span style={styles.status}>{formatStatus(incident.status)}</span>
      </div>

      <div style={styles.titleRow}>
        <span style={{ ...styles.type, color: sevColor }}>
          {incident.type.toUpperCase()}
        </span>
        <span style={styles.severity}>{incident.severity}</span>
      </div>

      <p style={styles.description}>{incident.description}</p>

      <div style={styles.metaBlock}>
        <div style={styles.metaRow}>
          <MapPin size={14} color="var(--accent-primary)" />
          <span>{incident.address || 'Location on map'}</span>
        </div>
        {incident.location?.coordinates && (
          <div style={styles.coords}>
            {incident.location.coordinates[1].toFixed(4)},{' '}
            {incident.location.coordinates[0].toFixed(4)}
          </div>
        )}
        <div style={styles.metaRow}>
          <Clock size={14} color="var(--text-muted)" />
          <span>{timeAgo(incident.createdAt)}</span>
        </div>
      </div>

      {expanded && incident.ai?.summary && (
        <div style={styles.aiBlock}>
          <div style={styles.aiLabel}>AI Summary</div>
          <p style={styles.aiSummary}>{incident.ai.summary}</p>
        </div>
      )}

      {action && (
        <Button
          variant={action.variant}
          size="lg"
          loading={loading}
          onClick={() => onStatusChange(incident, action.next)}
          style={{ width: '100%', marginTop: 'var(--space-3)' }}
        >
          <action.icon size={18} /> {action.label}
        </Button>
      )}

      {incident.status === 'resolved' && (
        <div style={styles.resolvedBanner}>
          <CheckCircle2 size={16} /> Incident resolved
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    padding: 'var(--space-4)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderLeft: '4px solid',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 'var(--space-3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-3)',
  },
  idRow: { display: 'flex', gap: 'var(--space-2)', alignItems: 'center' },
  publicId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  status: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 500,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-2)',
  },
  type: { fontSize: '16px', fontWeight: 800, letterSpacing: '1px' },
  severity: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  description: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: 'var(--space-3)',
  },
  metaBlock: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  coords: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    marginLeft: '22px',
  },
  aiBlock: {
    marginTop: 'var(--space-3)',
    padding: 'var(--space-3)',
    background: 'var(--bg-base)',
    borderRadius: 'var(--radius-md)',
  },
  aiLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--accent-primary)',
    fontWeight: 600,
    marginBottom: 'var(--space-1)',
  },
  aiSummary: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  resolvedBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3)',
    background: 'rgba(22, 163, 74, 0.15)',
    color: 'var(--accent-success)',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: 500,
    marginTop: 'var(--space-3)',
  },
};

export default AssignmentCard;