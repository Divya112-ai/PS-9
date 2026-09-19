import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, RotateCcw } from 'lucide-react';
import KPICards from '../components/dashboard/KPICards';
import IncidentCard from '../components/incidents/IncidentCard';
import ResourcePanel from '../components/resources/ResourcePanel';
import AlertFeed from '../components/alerts/AlertFeed';
import MapView from '../components/map/MapView';
import Button from '../components/common/Button';
import { incidentAPI, resourceAPI, alertAPI, analyticsAPI, demoAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [runningDemo, setRunningDemo] = useState(false);

  // ─── Initial load ───
  const loadData = useCallback(async () => {
    try {
      const params = filter === 'active' ? { active: 'true' } : { status: filter };
      const [incRes, resRes, alertRes, kpiRes] = await Promise.all([
        incidentAPI.list(params),
        resourceAPI.list({}),
        alertAPI.list({ acknowledged: 'false' }),
        analyticsAPI.overview(),
      ]);

      setIncidents(incRes.data.data.incidents || []);
      setResources(resRes.data.data.resources || []);
      setAlerts(alertRes.data.data.alerts || []);
      setKpis(kpiRes.data.data);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh KPIs and alerts when incidents change
  const refreshKPIs = useCallback(async () => {
    try {
      const [kpiRes, alertRes] = await Promise.all([
        analyticsAPI.overview(),
        alertAPI.list({ acknowledged: 'false' }),
      ]);
      setKpis(kpiRes.data.data);
      setAlerts(alertRes.data.data.alerts || []);
    } catch (err) {
      console.error('KPI refresh failed:', err);
    }
  }, []);

  // ─── Socket.IO listeners ───
  useSocketEvent('incident:created', (incident) => {
    setIncidents((prev) => {
      if (prev.find((i) => i._id === incident._id)) return prev;
      return [incident, ...prev];
    });
    refreshKPIs();
  });

  useSocketEvent('incident:updated', (incident) => {
    setIncidents((prev) =>
      prev.map((i) => (i._id === incident._id ? { ...i, ...incident } : i))
    );
    if (selectedIncident?._id === incident._id) {
      setSelectedIncident((prev) => ({ ...prev, ...incident }));
    }
    refreshKPIs();
  });

  useSocketEvent('incident:assigned', ({ incident, resource }) => {
    setIncidents((prev) =>
      prev.map((i) => (i._id === incident._id ? { ...i, ...incident } : i))
    );
    setResources((prev) =>
      prev.map((r) => (r._id === resource._id ? { ...r, ...resource } : r))
    );
    refreshKPIs();
  });

  useSocketEvent('resource:updated', (resource) => {
    setResources((prev) =>
      prev.map((r) => (r._id === resource._id ? { ...r, ...resource } : r))
    );
  });

  useSocketEvent('alert:created', (alert) => {
    setAlerts((prev) => [alert, ...prev]);
    refreshKPIs();
  });

  useSocketEvent('demo:reset', () => {
    loadData();
  });

  // ─── Handlers ───
  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await alertAPI.acknowledge(alertId);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      refreshKPIs();
    } catch (err) {
      console.error('Ack failed:', err);
    }
  };

  const handleRunDemo = async () => {
    if (!window.confirm('Run Market Fire demo? This creates a new incident.')) return;
    setRunningDemo(true);
    try {
      await demoAPI.marketFire();
      // Demo runs in background — socket events will stream in
    } catch (err) {
      alert('Demo failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setTimeout(() => setRunningDemo(false), 2000);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo? This deletes all incidents, alerts, and events.')) return;
    try {
      await demoAPI.reset();
      loadData();
    } catch (err) {
      alert('Reset failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // ─── Filtered lists ───
  const activeResources = resources.filter((r) => r.status !== 'available');
  const availableResources = resources.filter((r) => r.status === 'available');

  if (loading) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={20} className="spin" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ─── KPI row ─── */}
      <KPICards data={kpis} />

      {/* ─── Action bar ─── */}
      {hasRole('admin', 'operator') && (
        <div style={styles.actionBar}>
          <Button variant="danger" size="sm" onClick={handleRunDemo} loading={runningDemo}>
            🔥 Run Market Fire Demo
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetDemo}>
            <RotateCcw size={14} /> Reset Demo
          </Button>
        </div>
      )}

      {/* ─── Main 3-column layout ─── */}
      <div style={styles.mainGrid}>
        {/* ─── Left: Incident list ─── */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Incidents ({incidents.length})</h3>
            <div style={styles.filterRow}>
              {['active', 'classified', 'assigned', 'on_scene', 'resolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    ...styles.filterBtn,
                    ...(filter === f ? styles.filterBtnActive : {}),
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.scrollList}>
            {incidents.length === 0 ? (
              <p style={styles.emptyText}>No incidents match this filter</p>
            ) : (
              incidents.map((incident) => (
                <IncidentCard
                  key={incident._id}
                  incident={incident}
                  onClick={() => handleIncidentClick(incident)}
                  selected={selectedIncident?._id === incident._id}
                />
              ))
            )}
          </div>
        </div>

        {/* ─── Center: Map ─── */}
        <div style={styles.mapPanel}>
          <MapView
            incidents={incidents}
            resources={resources}
            center={
              selectedIncident?.location?.coordinates
                ? selectedIncident.location.coordinates
                : null
            }
            height="100%"
          />
        </div>

        {/* ─── Right: Resources ─── */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Resources ({resources.length})</h3>
          </div>
          <div style={styles.scrollList}>
            <ResourcePanel
              resources={activeResources}
              title={`Deployed (${activeResources.length})`}
              emptyText="No deployed resources"
            />
            <ResourcePanel
              resources={availableResources}
              title={`Available (${availableResources.length})`}
              emptyText="No available resources"
            />
          </div>
        </div>
      </div>

      {/* ─── Bottom: Alert feed ─── */}
      <div style={styles.alertPanel}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>Alerts ({alerts.length})</h3>
        </div>
        <AlertFeed alerts={alerts} onAcknowledge={handleAcknowledge} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    height: '100%',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-12)',
    color: 'var(--text-muted)',
  },
  actionBar: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr 300px',
    gap: 'var(--space-4)',
    flex: 1,
    minHeight: '500px',
  },
  panel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mapPanel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  panelHeader: {
    padding: 'var(--space-3)',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  filterRow: {
    display: 'flex',
    gap: '4px',
  },
  filterBtn: {
    fontSize: '10px',
    padding: '3px 8px',
    background: 'transparent',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 500,
  },
  filterBtnActive: {
    background: 'var(--accent-primary)',
    color: '#fff',
    borderColor: 'var(--accent-primary)',
  },
  scrollList: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-3)',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: 'var(--space-8)',
  },
  alertPanel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    maxHeight: '260px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};

export default Dashboard;