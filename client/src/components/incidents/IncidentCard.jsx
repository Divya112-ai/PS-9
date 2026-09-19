import { MapPin, Clock, AlertCircle, Users } from 'lucide-react';
import Badge from '../common/Badge';
import { severityColor, priorityColor, timeAgo } from '../../utils/formatters';

const IncidentCard = ({ incident, onClick, selected = false }) => {
  const sevColor = severityColor(incident.severity);

  return (
    <div
      onClick={onClick}
      style={{
        ...styles.card,
        borderLeft: `4px solid ${sevColor}`,
        ...(selected ? styles.selected : {}),
      }}
    >
      <div style={styles.header}>
        <div style={styles.idBlock}>
          <span style={styles.publicId}>{incident.publicId}</span>
          <Badge color={incident.priority === 'P1' ? 'critical' : incident.priority === 'P2' ? 'high' : incident.priority === 'P3' ? 'medium' : 'low'}>
            {incident.priority}
          </Badge>
        </div>
        <span style={{ ...styles.type, textTransform: 'capitalize' }}>{incident.type}</span>
      </div>

      <p style={styles.description}>{incident.description}</p>

      <div style={styles.meta}>
        <div style={styles.metaItem}>
          <MapPin size={12} />
          <span>{incident.address || 'Unknown location'}</span>
        </div>
        <div style={styles.metaItem}>
          <Clock size={12} />
          <span>{timeAgo(incident.createdAt)}</span>
        </div>
        {incident.assignedResources?.length > 0 && (
          <div style={styles.metaItem}>
            <Users size={12} />
            <span>{incident.assignedResources.length} dispatched</span>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <Badge color={incident.severity === 'critical' ? 'critical' : incident.severity === 'high' ? 'high' : incident.severity === 'medium' ? 'medium' : 'low'} size="sm">
          {incident.severity}
        </Badge>
        <span style={styles.status}>{incident.status.replace('_', ' ')}</span>
      </div>
    </div>
  );
};

const styles = {
  card: {
    padding: 'var(--space-3)',
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    border: '1px solid var(--border-subtle)',
    marginBottom: 'var(--space-2)',
  },
  selected: {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--accent-primary)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-2)',
  },
  idBlock: {
    display: 'flex',
    gap: 'var(--space-2)',
    alignItems: 'center',
  },
  publicId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  type: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  description: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    marginBottom: 'var(--space-2)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-2)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 'var(--space-2)',
    borderTop: '1px solid var(--border-subtle)',
  },
  status: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};

export default IncidentCard;