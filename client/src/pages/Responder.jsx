import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Inbox } from 'lucide-react';
import AssignmentCard from '../components/responder/AssignmentCard';
import Card from '../components/common/Card';
import { incidentAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

const Responder = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState('');

  const loadIncidents = useCallback(async () => {
    try {
      const activeRes = await incidentAPI.list({ active: 'true' });
      const active = activeRes.data.data.incidents || [];

      const resolvedRes = await incidentAPI.list({ status: 'resolved', limit: 5 });
      const resolved = resolvedRes.data.data.incidents || [];

      setIncidents([...active, ...resolved]);
    } catch (err) {
      console.error('Failed to load incidents:', err);
      setError('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, []);

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

  useSocketEvent('incident:assigned', ({ incident }) => {
    setIncidents((prev) =>
      prev.map((i) => (i._id === incident._id ? { ...i, ...incident } : i))
    );
  });

  const handleStatusChange = async (incident, nextStatus) => {
    setUpdating(incident._id);
    setError('');
    try {
      await incidentAPI.updateStatus(incident._id, nextStatus);
      setIncidents((prev) =>
        prev.map((i) =>
          i._id === incident._id ? { ...i, status: nextStatus } : i
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const sorted = [...incidents].sort((a, b) => {
    const aDone = ['resolved', 'closed', 'merged'].includes(a.status);
    const bDone = ['resolved', 'closed', 'merged'].includes(b.status);
    if (aDone !== bDone) return aDone ? 1 : -1;
    const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
    return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
  });

  const activeCount = incidents.filter(
    (i) => !['resolved', 'closed', 'merged'].includes(i.status)
  ).length;

  if (loading) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={20} />
        <span>Loading assignments…</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Card padding="md">
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Assignments</h1>
            <p style={styles.subtitle}>
              Welcome, {user?.name} · {user?.organization || 'Field Unit'}
            </p>
          </div>
          <div style={styles.statBlock}>
            <div style={styles.statValue}>{activeCount}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>
      </Card>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.list}>
        {sorted.length === 0 ? (
          <Card padding="lg" style={styles.emptyCard}>
            <Inbox size={48} color="var(--text-muted)" />
            <h3 style={styles.emptyTitle}>No assignments</h3>
            <p style={styles.emptyText}>
              You have no active incidents. New assignments will appear here in
              real-time.
            </p>
          </Card>
        ) : (
          sorted.map((incident) => (
            <AssignmentCard
              key={incident._id}
              incident={incident}
              onStatusChange={handleStatusChange}
              loading={updating === incident._id}
              expanded={incident.status === 'on_scene'}
            />
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: 'var(--space-4)',
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: 'var(--space-1)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  statBlock: { textAlign: 'right' },
  statValue: {
    fontSize: '32px',
    fontWeight: 800,
    color: 'var(--accent-primary)',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  errorBanner: {
    padding: 'var(--space-3)',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid var(--accent-danger)',
    color: 'var(--accent-danger)',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  emptyCard: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-3)',
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

export default Responder;