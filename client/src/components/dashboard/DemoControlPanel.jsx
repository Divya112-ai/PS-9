import { useState } from 'react';
import { Play, RotateCcw, AlertTriangle } from 'lucide-react';
import Button from '../common/Button';
import { demoAPI } from '../../services/api';
import { useToast } from '../common/Toast';

const DemoControlPanel = ({ onDemoComplete }) => {
  const { showToast } = useToast();
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleRunDemo = async () => {
    setRunning(true);
    try {
      await demoAPI.marketFire();
      showToast('🔥 Market Fire demo started — watch the dashboard!', 'success');
      onDemoComplete?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Demo failed to start', 'error');
    } finally {
      setTimeout(() => setRunning(false), 3000);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await demoAPI.reset();
      showToast('Demo state reset — clean slate', 'success');
      onDemoComplete?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Reset failed', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <AlertTriangle size={16} color="var(--accent-warning)" />
        <span style={styles.label}>Demo Controls</span>
      </div>
      <div style={styles.buttons}>
        <Button
          variant="danger"
          size="sm"
          onClick={handleRunDemo}
          loading={running}
        >
          <Play size={14} /> Run Market Fire
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          loading={resetting}
        >
          <RotateCcw size={14} /> Reset
        </Button>
      </div>
    </div>
  );
};

const styles = {
  panel: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.08), transparent)',
    border: '1px dashed var(--accent-warning)',
    borderRadius: 'var(--radius-md)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--accent-warning)',
  },
  buttons: {
    display: 'flex',
    gap: 'var(--space-2)',
    marginLeft: 'auto',
  },
};

export default DemoControlPanel;