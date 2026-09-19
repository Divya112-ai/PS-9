// ─── Date/time ───
export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const timeAgo = (date) => {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ─── Severity / priority color helpers ───
export const severityColor = (severity) => {
  const map = {
    critical: 'var(--severity-critical)',
    high: 'var(--severity-high)',
    medium: 'var(--severity-medium)',
    low: 'var(--severity-low)',
  };
  return map[severity] || 'var(--text-muted)';
};

export const priorityColor = (priority) => {
  const map = {
    P1: 'var(--priority-p1)',
    P2: 'var(--priority-p2)',
    P3: 'var(--priority-p3)',
    P4: 'var(--priority-p4)',
  };
  return map[priority] || 'var(--text-muted)';
};

export const statusColor = (status) => {
  const map = {
    reported: 'var(--status-reported)',
    classified: 'var(--status-classified)',
    assigned: 'var(--status-assigned)',
    en_route: 'var(--status-en_route)',
    on_scene: 'var(--status-on_scene)',
    resolved: 'var(--status-resolved)',
    closed: 'var(--status-closed)',
    merged: 'var(--status-merged)',
  };
  return map[status] || 'var(--text-muted)';
};

export const formatStatus = (status) => {
  return status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';
};

export const formatDistance = (km) => {
  if (km == null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};