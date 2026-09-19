import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MapPin, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { incidentAPI } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const EMERGENCY_TYPES = [
  { value: '', label: 'Auto-detect from description' },
  { value: 'fire', label: '🔥 Fire' },
  { value: 'flood', label: '🌊 Flood' },
  { value: 'medical', label: '🚑 Medical Emergency' },
  { value: 'accident', label: '🚗 Road Accident' },
  { value: 'industrial', label: '🏭 Industrial' },
  { value: 'structural', label: '🏚️ Structural Collapse' },
  { value: 'other', label: '❓ Other' },
];

export default function CitizenReport() {
  const [form, setForm] = useState({
    description: '',
    address: '',
    type: '',
    coordinates: null,
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          coordinates: [pos.coords.longitude, pos.coords.latitude],
        }));
        setLocationLoading(false);
      },
      (err) => {
        setError(`Location error: ${err.message}. Please try again.`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.description.trim() || form.description.trim().length < 10) {
      setError('Please describe the emergency (at least 10 characters).');
      return;
    }

    if (!form.coordinates) {
      setError('Please click "Use my location" or enter an address.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        description: form.description.trim(),
        location: { coordinates: form.coordinates },
        address: form.address || null,
      };

      const { data } = await incidentAPI.create(payload);
      setSuccess(data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ description: '', address: '', type: '', coordinates: null });
    setSuccess(null);
    setError('');
  };

  // ═══════════════════════════════════════════
  // SUCCESS SCREEN
  // ═══════════════════════════════════════════
  if (success) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.successWrapper}>
          <Card padding="lg" style={styles.successCard}>
            <div style={styles.successIcon}>
              <CheckCircle size={64} color="var(--accent-success)" />
            </div>
            <h1 style={styles.successTitle}>Report Submitted</h1>
            <p style={styles.successSubtitle}>
              Your emergency report has been received and routed to our command center.
            </p>

            <div style={styles.trackingBox}>
              <p style={styles.trackingLabel}>Your Tracking ID</p>
              <p style={styles.trackingValue}>{success.trackingId}</p>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <span style={styles.infoKey}>Incident</span>
                <span style={styles.infoValue}>{success.incident.publicId}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoKey}>Type</span>
                <span style={{ ...styles.infoValue, textTransform: 'capitalize' }}>
                  {success.incident.type}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoKey}>Priority</span>
                <span style={{ ...styles.infoValue, color: 'var(--severity-critical)' }}>
                  {success.incident.priority} · {success.incident.severity}
                </span>
              </div>
            </div>

            {success.classification?.source === 'ai' && (
              <p style={styles.aiNote}>
                ✨ AI classified this report with {(success.classification.confidence * 100).toFixed(0)}% confidence
              </p>
            )}

            <div style={styles.successActions}>
              <Button variant="primary" onClick={resetForm}>
                Submit another report
              </Button>
              <Link to="/" style={styles.backLink}>
                ← Back to home
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // FORM
  // ═══════════════════════════════════════════
  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <Link to="/login" style={styles.headerBack}>
          <ArrowLeft size={18} /> Back
        </Link>
        <div style={styles.headerBrand}>
          <span style={{ fontSize: '24px' }}>🚨</span>
          <span style={styles.headerBrandText}>PS-9 Emergency Report</span>
        </div>
      </header>

      <main style={styles.formWrapper}>
        <Card padding="lg" style={styles.formCard}>
          <div style={styles.formHeader}>
            <AlertTriangle size={32} color="var(--accent-warning)" />
            <div>
              <h1 style={styles.formTitle}>Report an Emergency</h1>
              <p style={styles.formSubtitle}>
                Provide details about the emergency. Your report will be routed to
                the appropriate emergency services.
              </p>
            </div>
          </div>

          {error && <div style={styles.errorBanner}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                What is happening? <span style={styles.required}>*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the emergency. Include location details, people involved, and any immediate dangers."
                rows={5}
                maxLength={2000}
                style={styles.textarea}
                autoFocus
              />
              <p style={styles.hint}>
                {form.description.length}/2000 characters — the more detail, the better we can help
              </p>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Emergency type (optional)</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                style={styles.select}
              >
                {EMERGENCY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p style={styles.hint}>
                Leave as auto-detect if unsure — our system will classify it.
              </p>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Location <span style={styles.required}>*</span>
              </label>

              <Button
                type="button"
                variant={form.coordinates ? 'success' : 'subtle'}
                size="md"
                loading={locationLoading}
                onClick={detectLocation}
                style={{ width: '100%', marginBottom: 'var(--space-3)' }}
              >
                <MapPin size={16} />
                {form.coordinates
                  ? `Location captured (${form.coordinates[1].toFixed(4)}, ${form.coordinates[0].toFixed(4)})`
                  : 'Use my current location'}
              </Button>

              <Input
                label="Or enter an address (optional)"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="e.g., Central Market, Ahmedabad"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              style={{ width: '100%', marginTop: 'var(--space-4)' }}
            >
              <Send size={18} /> Submit Emergency Report
            </Button>

            <p style={styles.footnote}>
              ⚠️ This is a demonstration platform. For real emergencies, call your
              local emergency number (112 in India).
            </p>
          </form>
        </Card>
      </main>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-4) var(--space-6)',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
  },
  headerBack: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  headerBrandText: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  formWrapper: {
    display: 'flex',
    justifyContent: 'center',
    padding: 'var(--space-8) var(--space-4)',
  },
  formCard: {
    width: '100%',
    maxWidth: '640px',
  },
  formHeader: {
    display: 'flex',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
    alignItems: 'flex-start',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: 'var(--space-1)',
  },
  formSubtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  errorBanner: {
    padding: 'var(--space-3) var(--space-4)',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--accent-danger)',
    fontSize: '13px',
    marginBottom: 'var(--space-4)',
  },
  fieldGroup: {
    marginBottom: 'var(--space-5)',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-2)',
  },
  required: {
    color: 'var(--accent-danger)',
  },
  textarea: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--bg-base)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.5,
  },
  select: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--bg-base)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: 'var(--space-1)',
  },
  footnote: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: 'var(--space-4)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--border-subtle)',
  },
  // ─── Success screen ───
  successWrapper: {
    display: 'flex',
    justifyContent: 'center',
    padding: 'var(--space-12) var(--space-4)',
  },
  successCard: {
    width: '100%',
    maxWidth: '520px',
    textAlign: 'center',
  },
  successIcon: {
    marginBottom: 'var(--space-4)',
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: 'var(--space-2)',
  },
  successSubtitle: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-6)',
    lineHeight: 1.5,
  },
  trackingBox: {
    padding: 'var(--space-4)',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 'var(--space-6)',
  },
  trackingLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-1)',
  },
  trackingValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--accent-primary)',
  },
  infoGrid: {
    textAlign: 'left',
    padding: 'var(--space-4)',
    background: 'var(--bg-base)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-4)',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 'var(--space-2) 0',
    fontSize: '14px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  infoKey: { color: 'var(--text-muted)' },
  infoValue: { color: 'var(--text-primary)', fontWeight: 500 },
  aiNote: {
    fontSize: '13px',
    color: 'var(--accent-primary)',
    marginBottom: 'var(--space-4)',
  },
  successActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    alignItems: 'center',
    marginTop: 'var(--space-4)',
  },
  backLink: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
};