import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { resourceAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';

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

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadResources = useCallback(async () => {
    try {
      const params = filter === 'all' ? {} : { status: filter };
      const { data } = await resourceAPI.list(params);
      setResources(data.data.resources || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useSocketEvent('resource:updated', (updated) => {
    setResources((prev) =>
      prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r))
    );
  });

  // Summary counts
  const counts = {
    available: resources.filter((r) => r.status === 'available').length,
    deployed: resources.filter((r) => r.status === 'assigned' || r.status === 'en_route' || r.status === 'on_scene').length,
    unavailable: resources.filter((r) => r.status === 'unavailable').length,
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={20} className="spin" />
        <span>Loading resources…</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ─── Summary cards ─── */}
      <div style={styles.summaryGrid}>
        <Card padding="md">
          <div style={styles.summaryValue}>{counts.available}</div>
          <div style={styles.summaryLabel}>Available</div>
        </Card>
        <Card padding="md">
          <div style={styles.summaryValue}>{counts.deployed}</div>
          <div style={styles.summaryLabel}>Deployed</div>
        </Card>
        <Card padding="md">
          <div style={styles.summaryValue}>{counts.unavailable}</div>
          <div style={styles.summaryLabel}>Unavailable</div>
        </Card>
        <Card padding="md">
          <div style={styles.summaryValue}>{resources.length}</div>
          <div style={styles.summaryLabel}>Total</div>
        </Card>
      </div>

      {/* ─── Filters ─── */}
      <div style={styles.filterBar}>
        <h2 style={styles.title}>Fleet ({resources.length})</h2>
        <div style={styles.filterRow}>
          {['all', 'available', 'assigned', 'en_route', 'on_scene', 'unavailable'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                ...(filter === f ? styles.filterBtnActive : {}),
              }}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Table ─── */}
      <Card padding="none">
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Capabilities</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={6} style={styles.emptyCell}>
                    No resources match this filter
                  </td>
                </tr>
              ) : (
                resources.map((r) => (
                  <tr key={r._id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.publicId}>{r.publicId}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ marginRight: 6 }}>{SUBTYPE_ICONS[r.subtype] || '•'}</span>
                      <span style={styles.mutedText}>{r.subtype.replace('_', ' ')}</span>
                    </td>
                    <td style={styles.td}>{r.name}</td>
                    <td style={styles.td}>
                      <div style={styles.capRow}>
                        {(r.capabilities || []).slice(0, 3).map((cap) => (
                          <span key={cap} style={styles.capPill}>
                            {cap.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.coordText}>
                        {r.location?.coordinates
                          ? `${r.location.coordinates[1].toFixed(3)}, ${r.location.coordinates[0].toFixed(3)}`
                          : '—'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Badge color={STATUS_COLORS[r.status] || 'default'} size="sm">
                        {r.status.replace('_', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-12)',
    color: 'var(--text-muted)',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-3)',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: 'var(--space-1)',
    fontWeight: 500,
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
  },
  filterRow: {
    display: 'flex',
    gap: '4px',
  },
  filterBtn: {
    fontSize: '11px',
    padding: '4px 10px',
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
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  theadRow: {
    background: 'var(--bg-elevated)',
  },
  th: {
    textAlign: 'left',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-muted)',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-subtle)',
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle)',
  },
  td: {
    padding: 'var(--space-3) var(--space-4)',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
  },
  publicId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--accent-primary)',
  },
  mutedText: {
    color: 'var(--text-muted)',
    textTransform: 'capitalize',
  },
  capRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  capPill: {
    fontSize: '10px',
    padding: '2px 6px',
    background: 'var(--bg-elevated)',
    color: 'var(--text-muted)',
    borderRadius: 'var(--radius-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  coordText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  emptyCell: {
    textAlign: 'center',
    padding: 'var(--space-12)',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
};

export default Resources;