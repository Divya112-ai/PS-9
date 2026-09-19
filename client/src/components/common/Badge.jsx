const Badge = ({ children, color = 'default', size = 'md' }) => {
  const colors = {
    default: { bg: 'var(--bg-elevated)', fg: 'var(--text-secondary)' },
    critical: { bg: 'rgba(220, 38, 38, 0.15)', fg: 'var(--severity-critical)' },
    high: { bg: 'rgba(234, 88, 12, 0.15)', fg: 'var(--severity-high)' },
    medium: { bg: 'rgba(202, 138, 4, 0.15)', fg: 'var(--severity-medium)' },
    low: { bg: 'rgba(22, 163, 74, 0.15)', fg: 'var(--severity-low)' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', fg: 'var(--severity-info)' },
  };

  const sizes = {
    sm: { padding: '2px 6px', fontSize: '10px' },
    md: { padding: '3px 8px', fontSize: '11px' },
    lg: { padding: '4px 10px', fontSize: '12px' },
  };

  const { bg, fg } = colors[color] || colors.default;

  return (
    <span
      style={{
        background: bg,
        color: fg,
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'inline-block',
        ...sizes[size],
      }}
    >
      {children}
    </span>
  );
};

export default Badge;