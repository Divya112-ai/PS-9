const ChartCard = ({ title, subtitle, children, height = 300 }) => (
  <div style={styles.card}>
    <div style={styles.header}>
      <h3 style={styles.title}>{title}</h3>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
    </div>
    <div style={{ height }}>
      {children}
    </div>
  </div>
);

const styles = {
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4)',
  },
  header: {
    marginBottom: 'var(--space-3)',
  },
  title: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
};

export default ChartCard;