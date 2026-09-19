import { MapPin, Clock, CheckCircle, Truck } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { formatDistance } from '../../utils/formatters';

const SUBTYPE_ICONS = {
  fire_team: '🚒',
  ambulance: '🚑',
  police: '🚓',
  rescue: '🛟',
  hospital: '🏥',
  shelter: '🏠',
};

const RecommendationCard = ({ recommendation, onDispatch, loading = false }) => {
  const { publicId, name, subtype, matchScore, distanceKm, etaMinutes, status, capabilities } = recommendation;

  // Match score color
  const scoreColor =
    matchScore >= 80 ? 'var(--accent-success)'
    : matchScore >= 60 ? 'var(--accent-warning)'
    : 'var(--text-muted)';

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div style={styles.left}>
          <span style={styles.emoji}>{SUBTYPE_ICONS[subtype] || '•'}</span>
          <div>
            <div style={styles.name}>{name}</div>
            <div style={styles.publicId}>{publicId}</div>
          </div>
        </div>
        <div style={{ ...styles.score, color: scoreColor }}>
          {matchScore}
          <span style={styles.scoreLabel}>%</span>
        </div>
      </div>

      <div style={styles.metaGrid}>
        <div style={styles.metaItem}>
          <MapPin size={12} />
          <span>{formatDistance(distanceKm)}</span>
        </div>
        <div style={styles.metaItem}>
          <Clock size={12} />
          <span>ETA {etaMinutes} min</span>
        </div>
      </div>

      {capabilities && capabilities.length > 0 && (
        <div style={styles.capabilities}>
          {capabilities.slice(0, 3).map((cap) => (
            <span key={cap} style={styles.capability}>
              {cap.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}

      <Button
        variant={status === 'available' ? 'primary' : 'ghost'}
        size="sm"
        disabled={status !== 'available' || loading}
        loading={loading}
        onClick={() => onDispatch?.(recommendation)}
        style={{ width: '100%', marginTop: 'var(--space-2)' }}
      >
        {status === 'available' ? (
          <>
            <Truck size={14} /> Dispatch
          </>
        ) : (
          <>
            <CheckCircle size={14} /> {status}
          </>
        )}
      </Button>
    </div>
  );
};

const styles = {
  card: {
    padding: 'var(--space-3)',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    marginBottom: 'var(--space-2)',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-3)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  emoji: {
    fontSize: '22px',
  },
  name: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  publicId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  score: {
    fontSize: '22px',
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: '12px',
    fontWeight: 500,
    opacity: 0.6,
  },
  metaGrid: {
    display: 'flex',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-2)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  capabilities: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: 'var(--space-2)',
  },
  capability: {
    fontSize: '9px',
    padding: '2px 6px',
    background: 'var(--bg-base)',
    color: 'var(--text-dim)',
    borderRadius: 'var(--radius-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};

export default RecommendationCard;