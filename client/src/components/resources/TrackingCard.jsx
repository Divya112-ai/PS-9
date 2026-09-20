import { MapPin, Clock, Navigation, Activity } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDistance, timeAgo } from '../../utils/formatters';

const SUBTYPE_ICONS = {
  fire_team: '🚒',
  ambulance: '🚑',
  police: '🚓',
  rescue: '🛟',
  hospital: '🏥',
};

const TrackingCard = ({ resource, onFocus }) => {
  if (!resource || !resource.location?.coordinates) return null;

  const [lng, lat] = resource.location.coordinates;
  const subtypeIcon = SUBTYPE_ICONS[resource.subtype] || '•';
  const eta = resource.etaMinutes ?? '—';
  const distance = resource.distanceKm;

  return (
    <div style={styles.card}>
      {/* ─── Header ─── */}
      <div style={styles.header}>
        <div style={styles.left}>
          <span style={styles.icon}>{subtypeIcon}</span>
          <div>
            <div style={styles.name}>{resource.name}</div>
            <div style={styles.publicId}>{resource.publicId}</div>
          </div>
        </div>
        <div style={styles.liveBadge}>
          <span style={styles.pulse} />
          <span>LIVE</span>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <Navigation size={12} />
          <span>{formatDistance(distance)}</span>
        </div>
        <div style={styles.stat}>
          <Clock size={12} />
          <span>ETA {eta} min</span>
        </div>
        <div style={styles.stat}>
          <Activity size={12} />
          <span>{timeAgo(resource.lastUpdated)}</span>
        </div>
      </div>

      {/* ─── Coordinates ─── */}
      <div style={styles.coordsBox}>
        <MapPin size={12} color="var(--accent-primary)" />
        <div>
          <div style={styles.coordsLabel}>Current position</div>
          <div style={styles.coordsValue}>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>
        </div>
      </div>

      {/* ─── Focus on map ─── */}
      {onFocus && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFocus(resource)}
          style={{ width: '100%', marginTop: 'var(--space-2)' }}
        >
          <MapPin size={12} /> Show on Map
        </Button>
      )}
    </div>
  );
};

const styles = {
  card: {
    padding: 'var(--space-3)',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))',
    border: '1px solid var(--accent-primary)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-3)',
  },
  header: {
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
  icon: { fontSize: '22px' },
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
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--accent-primary)',
    letterSpacing: '0.5px',
  },
  pulse: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)',
    animation: 'pulse 1.5s infinite',
  },
  statsRow: {
    display: 'flex',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-3)',
    paddingBottom: 'var(--space-3)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  coordsBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2)',
    background: 'var(--bg-base)',
    borderRadius: 'var(--radius-sm)',
  },
  coordsLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  coordsValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
};

export default TrackingCard;