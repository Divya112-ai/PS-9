const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) => {
  const variants = {
    primary: { background: 'var(--accent-primary)', color: '#fff' },
    danger: { background: 'var(--accent-danger)', color: '#fff' },
    success: { background: 'var(--accent-success)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' },
    subtle: { background: 'var(--bg-elevated)', color: 'var(--text-primary)' },
  };

  const sizes = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '13px' },
    md: { padding: '0.5rem 1rem', fontSize: '14px' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '15px' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 'var(--radius-md)',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.15s',
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
};

export default Button;