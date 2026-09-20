import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'var(--accent-success)',
  error: 'var(--accent-danger)',
  warning: 'var(--accent-warning)',
  info: 'var(--accent-primary)',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.container}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          const color = COLORS[toast.type];
          return (
            <div key={toast.id} style={{ ...styles.toast, borderLeftColor: color }}>
              <Icon size={18} color={color} />
              <span style={styles.message}>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} style={styles.closeBtn}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const styles = {
  container: {
    position: 'fixed',
    top: 'var(--space-4)',
    right: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    zIndex: 9999,
    maxWidth: '360px',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderLeft: '3px solid',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    animation: 'slideIn 0.2s ease',
  },
  message: {
    flex: 1,
    fontSize: '13px',
    color: 'var(--text-primary)',
  },
  closeBtn: {
    color: 'var(--text-muted)',
    padding: '2px',
    display: 'flex',
  },
};