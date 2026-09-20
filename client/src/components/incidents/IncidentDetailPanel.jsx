import { useEffect, useState, useCallback } from 'react';
import {
  X, MapPin, Clock, CheckCircle2, FileText, Zap, Users, GitMerge, AlertTriangle,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import RecommendationCard from '../resources/RecommendationCard';
import { incidentAPI } from '../../services/api';
import { timeAgo, formatDateTime, severityColor, statusColor, formatStatus } from '../../utils/formatters';

const STATUS_ACTIONS = {
  classified: [{ next: 'assigned', label: 'Mark Assigned', variant: 'primary' }],
  assigned: [{ next: 'en_route', label: 'En Route', variant: 'primary' }],
  en_route: [{ next: 'on_scene', label: 'On Scene', variant: 'primary' }],
  on_scene: [{ next: 'resolved', label: 'Resolve Incident', variant: 'success' }],
  resolved: [{ next: 'closed', label: 'Close', variant: 'subtle' }],
};

const IncidentDetailPanel = ({ incident: initialIncident, onClose, onUpdate }) => {
  const [incident, setIncident] = useState(initialIncident);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [dispatching, setDispatching] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState('');

  // Fetch full incident + recommendations when opened
  useEffect(() => {
    setIncident(initialIncident);

    const loadFull = async () => {
      try {
        const [incidentRes, recsRes] = await Promise.all([
          incidentAPI.get(initialIncident._id),
          incidentAPI.recommendations(initialIncident._id),
        ]);
        setIncident(incidentRes.data.data);
        setRecommendations(recsRes.data.data.recommendations || []);
      } catch (err) {
        console.error('Failed to load incident details:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoadingRecs(false);
      }
    };

    setLoadingRecs(true);
    loadFull();
  }, [initialIncident]);

  const handleDispatch = async (rec) => {
    setDispatching(rec.publicId);
    setError('');
    try {
      await incidentAPI.assign(incident._id, rec.resourceId);
      // Refresh incident + recommendations
      const [incidentRes, recsRes] = await Promise.all([
        incidentAPI.get(incident._id),
        incidentAPI.recommendations(incident._id),
      ]);
      setIncident(incidentRes.data.data);
      setRecommendations(recsRes.data.data.recommendations || []);
      onUpdate?.(incidentRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Dispatch failed');
    } finally {
      setDispatching(null);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    setUpdatingStatus(true);
    setError('');
    try {
      await incidentAPI.updateStatus(incident._id, nextStatus);
      const { data } = await incidentAPI.get(incident._id);
      setIncident(data.data);
      onUpdate?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMerge = async (sourceId) => {
    if (!window.confirm('Merge this duplicate into the current incident?')) return;
    try {
      await incidentAPI.merge(incident._id, sourceId);
      const { data } = await incidentAPI.get(incident._id);
      setIncident(data.data);
      onUpdate?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Merge failed');
    }
  };

  if (!incident) return null;

  const sevColor = severityColor(incident.severity);
  const statusActions = STATUS_ACTIONS[incident.status] || [];
  const isActive = !['resolved', 'closed', 'merged'].includes(incident.status);

  // Build timeline
  const timeline = [
    { label: 'Reported', time: incident.createdAt },
    { label: 'Assigned', time: incident.assignedAt },
    { label: 'On Scene', time: incident.onSceneAt },
    { label: 'Resolved', time: incident.resolvedAt },
  ].filter((t) => t.time);

  return (
    <div style={styles.drawer}>
      {/* ─── Header ─── */}
      <div style={{ ...styles.header, borderTopColor: sevColor }}>
        <div style={styles.headerTop}>
          <div>
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
              <Badge color={incident.severity === 'critical' ? 'critical' : incident.severity === 'high' ? 'high' : incident.severity === 'medium' ? 'medium' : 'low'}>
                {incident.severity}
              </Badge>
            </div>
            <h2 style={styles.title}>{incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} Incident</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.statusRow}>
          <span style={{ ...styles.statusDot, background: statusColor(incident.status) }} />
          <span style={styles.statusLabel}>{formatStatus(incident.status)}</span>
          <span style={styles.dotDivider}>·</span>
          <Clock size={12} />
          <span style={styles.timeLabel}>{timeAgo(incident.createdAt)}</span>
        </div>
      </div>

      {/* ─── Scrollable body ─── */}
      <div style={styles.body}>
        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* AI Analysis */}
        {incident.ai?.classified && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <Zap size={14} />
              <h4 style={styles.sectionTitle}>AI Analysis</h4>
              <span style={styles.confidence}>
                {Math.round((incident.ai.confidence || 0) * 100)}% confidence
              </span>
            </div>
            <p style={styles.summary}>{incident.ai.summary}</p>
            {incident.ai.recommendedActions?.length > 0 && (
              <ul style={styles.actionsList}>
                {incident.ai.recommendedActions.map((action, i) => (
                  <li key={i} style={styles.actionItem}>
                    <CheckCircle2 size={12} color="var(--accent-primary)" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Description */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <FileText size={14} />
            <h4 style={styles.sectionTitle}>Description</h4>
          </div>
          <p style={styles.description}>{incident.description}</p>
        </section>

        {/* Location */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <MapPin size={14} />
            <h4 style={styles.sectionTitle}>Location</h4>
          </div>
          <p style={styles.locationText}>
            {incident.address || 'No address provided'}
          </p>
          {incident.location?.coordinates && (
            <p style={styles.coords}>
              {incident.location.coordinates[1].toFixed(4)},{' '}
              {incident.location.coordinates[0].toFixed(4)}
            </p>
          )}
        </section>

        {/* Timeline */}
        {timeline.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <Clock size={14} />
              <h4 style={styles.sectionTitle}>Timeline</h4>
            </div>
            <div style={styles.timeline}>
              {timeline.map((item) => (
                <div key={item.label} style={styles.timelineItem}>
                  <span style={styles.timelineDot} />
                  <span style={styles.timelineLabel}>{item.label}</span>
                  <span style={styles.timelineTime}>{formatDateTime(item.time)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assigned Resources */}
        {incident.assignedResources?.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <Users size={14} />
              <h4 style={styles.sectionTitle}>
                Dispatched ({incident.assignedResources.length})
              </h4>
            </div>
            {incident.assignedResources.map((r) => (
              <div key={r._id} style={styles.assignedRow}>
                <div>
                  <div style={styles.resourceName}>{r.name}</div>
                  <div style={styles.publicIdSmall}>{r.publicId}</div>
                </div>
                <Badge color="info" size="sm">
                  {r.status?.replace('_', ' ') || 'assigned'}
                </Badge>
              </div>
            ))}
          </section>
        )}

        {/* Duplicate Candidates */}
        {incident.duplicateCandidates?.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <AlertTriangle size={14} color="var(--accent-warning)" />
              <h4 style={{ ...styles.sectionTitle, color: 'var(--accent-warning)' }}>
                Possible Duplicates ({incident.duplicateCandidates.length})
              </h4>
            </div>
            {incident.duplicateCandidates.map((dup) => (
              <div key={dup._id || dup.incidentId} style={styles.duplicateRow}>
                <div>
                  <div style={styles.resourceName}>
                    Duplicate score: {Math.round((dup.score || 0) * 100)}%
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMerge(dup.incidentId)}
                >
                  <GitMerge size={12} /> Merge
                </Button>
              </div>
            ))}
          </section>
        )}

        {/* Recommendations */}
        {isActive && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <Zap size={14} color="var(--accent-primary)" />
              <h4 style={{ ...styles.sectionTitle, color: 'var(--accent-primary)' }}>
                Recommended Resources
              </h4>
            </div>
            {loadingRecs ? (
              <p style={styles.muted}>Loading recommendations…</p>
            ) : recommendations.length === 0 ? (
              <p style={styles.muted}>No suitable resources available</p>
            ) : (
              recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.publicId}
                  recommendation={rec}
                  onDispatch={handleDispatch}
                  loading={dispatching === rec.publicId}
                />
              ))
            )}
          </section>
        )}
      </div>

      {/* ─── Action bar ─── */}
      {statusActions.length > 0 && (
        <div style={styles.actionBar}>
          {statusActions.map((action) => (
            <Button
              key={action.next}
              variant={action.variant}
              size="md"
              loading={updatingStatus}
              onClick={() => handleStatusChange(action.next)}
              style={{ flex: 1 }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
 drawer: {
  width: '100%',
  height: '100%',
  background: 'var(--bg-surface)',
  borderLeft: '1px solid var(--border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '-8px 0 24px rgba(0,0,0,0.3)', 
  },
  header: {
    padding: 'var(--space-4)',
    borderBottom: '1px solid var(--border-subtle)',
    borderTop: '3px solid',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-3)',
  },
  idRow: {
    display: 'flex',
    gap: 'var(--space-2)',
    alignItems: 'center',
    marginBottom: 'var(--space-1)',
  },
  publicId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 600,
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
  },
  closeBtn: {
    padding: 'var(--space-2)',
    color: 'var(--text-muted)',
    borderRadius: 'var(--radius-md)',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusLabel: {
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  dotDivider: { opacity: 0.4 },
  timeLabel: { fontSize: '12px' },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-4)',
  },
  section: {
    marginBottom: 'var(--space-5)',
    paddingBottom: 'var(--space-5)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-3)',
    color: 'var(--text-muted)',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    flex: 1,
  },
  confidence: {
    fontSize: '10px',
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
  },
  summary: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    marginBottom: 'var(--space-3)',
  },
  actionsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  description: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  locationText: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-1)',
  },
  coords: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  timelineItem: {
    display: 'grid',
    gridTemplateColumns: '12px 80px 1fr',
    gap: 'var(--space-2)',
    alignItems: 'center',
    fontSize: '12px',
  },
  timelineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
  },
  timelineLabel: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  timelineTime: {
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    textAlign: 'right',
  },
  assignedRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-2)',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-1)',
  },
  resourceName: {
    fontSize: '12px',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  publicIdSmall: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  duplicateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-2)',
    background: 'var(--bg-elevated)',
    border: '1px dashed var(--accent-warning)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-1)',
  },
  muted: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  errorBanner: {
    padding: 'var(--space-2) var(--space-3)',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid var(--accent-danger)',
    color: 'var(--accent-danger)',
    borderRadius: 'var(--radius-md)',
    fontSize: '12px',
    marginBottom: 'var(--space-3)',
  },
  actionBar: {
    padding: 'var(--space-3)',
    borderTop: '1px solid var(--border-subtle)',
    display: 'flex',
    gap: 'var(--space-2)',
  },
};

export default IncidentDetailPanel;