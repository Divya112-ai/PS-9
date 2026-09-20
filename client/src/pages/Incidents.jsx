import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import IncidentCard from '../components/incidents/IncidentCard';
import Card from '../components/common/Card';
import { incidentAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';

const FILTERS = [
  { key: 'active', label: 'Active', params: { active: 'true' } },
  { key: 'all', label: 'All', params: {} },
  { key: 'P1', label: 'P1', params: { priority: 'P1' } },
  { key: 'P2', label: 'P2', params: { priority: 'P2' } },
  { key: 'P3', label: 'P3', params: { priority: 'P3' } },
  { key: 'resolved', label: 'Resolved', params: { status: 'resolved' } },
  { key: 'merged', label: 'Merged', params: { status: 'merged' } },
];

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [filterKey, setFilterKey] = useState('active');
  const [loading, setLoading] = useState(true);

  const activeFilter = FILTERS.find((f) => f.key === filterKey) || FILTERS[0];

  const loadIncidents = useCallback(async () => {
    try {
      const { data } = await incidentAPI.list(activeFilter.params);
      setIncidents(data.data.incidents || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  useSocketEvent('incident:created', (incident) => {
    setIncidents((prev) => {
      if (prev.find((i) => i._id === incident._id)) return prev;
      return [incident, ...prev];
    });
  });

  useSocketEvent('incident:updated', (incident) => {
    setIncidents((prev) =>
      prev.map((i) => (i._id === incident._id ? { ...i, ...incident } : i))
    );
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>All Incidents ({incidents.length})</h1>
      </div>

      <div style={styles.filterRow}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterKey(f.key)}
            style={{
              ...styles.filterBtn,
              ...(filterKey === f.key ? styles.filterBtnActive : {}),
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>
          <RefreshCw size={20} className="spin" />
          <span>Loading incidents…</span>
        </div>
      ) : incidents.length === 0 ? (
        <Card padding="lg" style={styles.emptyCard}>
          <p style={styles.emptyText}>No incidents match this filter</p>
        </Card>
      ) : (
        <div style={styles.grid}>
          {incidents.map((incident) => (
            <IncidentCard
              key={incident._id}
              incident={incident}
              onClick={() => (window.location.href = `/dashboard?incident=${incident._id}`)}
            />
          ))}
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
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
  },
  filterRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    fontSize: '11px',
    padding: '5px 12px',
    background: 'transparent',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  filterBtnActive: {
    background: 'var(--accent-primary)',
    color: '#fff',
    borderColor: 'var(--accent-primary)',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-12)',
    color: 'var(--text-muted)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 'var(--space-3)',
  },
  emptyCard: {
    textAlign: 'center',
    padding: 'var(--space-12)',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
};

export default Incidents;