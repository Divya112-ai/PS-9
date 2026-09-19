import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, TrendingUp, MapPin } from 'lucide-react';
import ChartCard from '../components/analytics/ChartCard';
import IncidentsByTypeChart from '../components/analytics/IncidentsByTypeChart';
import SeverityChart from '../components/analytics/SeverityChart';
import ResponseTimeChart from '../components/analytics/ResponseTimeChart';
import ResourceUtilChart from '../components/analytics/ResourceUtilChart';
import KPICards from '../components/dashboard/KPICards';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { analyticsAPI } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import { severityColor } from '../utils/formatters';

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [byType, setByType] = useState([]);
  const [bySeverity, setBySeverity] = useState([]);
  const [responseTrend, setResponseTrend] = useState([]);
  const [resourceUtil, setResourceUtil] = useState({ byStatus: [] });
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [overviewRes, typeRes, sevRes, trendRes, resRes, hotRes] = await Promise.all([
        analyticsAPI.overview(),
        analyticsAPI.types(),
        analyticsAPI.severity(),
        analyticsAPI.responseTime(),
        analyticsAPI.resources(),
        analyticsAPI.hotspots(),
      ]);

      setOverview(overviewRes.data.data);
      setByType(typeRes.data.data.distribution || []);
      setBySeverity(sevRes.data.data.distribution || []);
      setResponseTrend(trendRes.data.data.trend || []);
      setResourceUtil(resRes.data.data);
      setHotspots(hotRes.data.data.hotspots || []);
    } catch (err) {
      console.error('Analytics load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh on any incident activity
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  useSocketEvent('incident:created', refresh);
  useSocketEvent('incident:updated', refresh);
  useSocketEvent('incident:resolved', refresh);

  if (loading) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={20} />
        <span>Loading analytics…</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ─── Header ─── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics</h1>
          <p style={styles.subtitle}>
            Real-time situational awareness from live incident data
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* ─── KPI cards ─── */}
      <KPICards data={overview} />

      {/* ─── Charts grid ─── */}
      <div style={styles.grid2}>
        <ChartCard title="Incidents by Type" subtitle="Distribution across categories">
          <IncidentsByTypeChart data={byType} />
        </ChartCard>

        <ChartCard title="Severity Distribution" subtitle="Breakdown by severity level">
          <SeverityChart data={bySeverity} />
        </ChartCard>
      </div>

      <div style={styles.grid2}>
        <ChartCard title="Response Time Trend" subtitle="Average minutes to resolve, last 7 days">
          <ResponseTimeChart data={responseTrend} />
        </ChartCard>

        <ChartCard title="Resource Status" subtitle="Fleet availability at a glance">
          <ResourceUtilChart data={resourceUtil.byStatus || []} />
        </ChartCard>
      </div>

      {/* ─── Hotspots ─── */}
      <ChartCard title="Incident Hotspots" subtitle="Areas with concentrated activity">
        {hotspots.length === 0 ? (
          <p style={styles.empty}>No hotspots yet</p>
        ) : (
          <div style={styles.hotspotGrid}>
            {hotspots.slice(0, 8).map((spot, i) => (
              <div key={i} style={styles.hotspotCard}>
                <div style={styles.hotspotHeader}>
                  <MapPin size={14} color="var(--accent-primary)" />
                  <span style={styles.hotspotCoords}>
                    {spot.lat.toFixed(3)}, {spot.lng.toFixed(3)}
                  </span>
                </div>
                <div style={styles.hotspotCount}>
                  {spot.count} <span style={styles.hotspotUnit}>incidents</span>
                </div>
                <div style={styles.hotspotTypes}>
                  {[...new Set(spot.incidents.map((i) => i.type))].map((type) => (
                    <span key={type} style={styles.hotspotType}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    maxWidth: '1400px',
    margin: '0 auto',
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
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 'var(--space-4)',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '13px',
    padding: 'var(--space-8)',
  },
  hotspotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 'var(--space-3)',
  },
  hotspotCard: {
    padding: 'var(--space-3)',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
  },
  hotspotHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-2)',
  },
  hotspotCoords: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  hotspotCount: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-2)',
  },
  hotspotUnit: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: 400,
    marginLeft: '4px',
  },
  hotspotTypes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  hotspotType: {
    fontSize: '10px',
    padding: '2px 6px',
    background: 'var(--bg-base)',
    color: 'var(--text-muted)',
    borderRadius: 'var(--radius-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};

export default Analytics;