import Badge from '../common/Badge';

const SUBTYPE_ICONS = {
  fire_team: '🚒',
  ambulance: '🚑',
  police: '🚓',
  rescue: '🛟',
  hospital: '🏥',
  shelter: '🏠',
};

const STATUS_COLORS = {
  available: 'low',
  assigned: 'info',
  en_route: 'medium',
  on_scene: 'high',
  unavailable: 'default',
};

const ResourcePanel = ({ resources, title, emptyText }) => {
  if (!resources || resources.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>{emptyText || 'No resources'}</p>
      </div>
    );
  }

  // Group by subtype
  const grouped = resources.reduce((acc, r) => {
    if (!acc[r.subtype]) acc[r.subtype] = [];
    acc[r.subtype].push(r);
    return acc;
  }, {});

  return (
    <div>
      {title && <h4 style={styles.title}>{title}</h4>}
      {Object.entries(grouped).map(([subtype, list]) => (
        <div key={subtype} style={styles.group}>
          <div style={styles.groupHeader}>
            <span>{SUBTYPE_ICONS[subtype] || '•'}</span>
            <span style={styles.groupLabel}>
              {subtype.replace('_', ' ')} ({list.length})
            </span>
          </div>
          {list.map((r) => (
            <div key={r._id} style={styles.row}>
              <div style={styles.rowLeft}>
                <span style={styles.publicId}>{r.publicId}</span>
                <span style={styles.name}>{r.name}</span>
              </div>
              <Badge color={STATUS_COLORS[r.status] || 'default'} size="sm">
                {r.status.replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const styles = {
  title: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-3)',
    fontWeight: 600,
  },
  group: {
    marginBottom: 'var(--space-4)',
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-2)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  groupLabel: {
    textTransform: 'capitalize',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: 'var(--space-1)',
    fontSize: '12px',
  },
  rowLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  publicId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  name: {
    fontSize: '12px',
    color: 'var(--text-primary)',
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

export default ResourcePanel;