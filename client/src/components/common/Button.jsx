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
    primary: {
      background: 'var(--accent-primary)',
      color: 'var(--text-inverse)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'var(--accent-danger)',
      color: 'var(--text-inverse)',
      border: '1px solid transparent',
    },
    success: {
      background: 'var(--accent-success)',
      color: 'var(--text-inverse)',
      border: '1px solid transparent',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)',
    },
    subtle: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-subtle)',
    },
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: 13, height: 32 },
    md: { padding: '8px 16px', fontSize: 14, height: 38 },
    lg: { padding: '10px 20px', fontSize: 15, height: 44 },
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.15s ease',
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        if (variant === 'primary') e.currentTarget.style.background = 'var(--accent-primary-hover)';
        if (variant === 'ghost') e.currentTarget.style.background = 'var(--bg-surface-hover)';
        if (variant === 'subtle') e.currentTarget.style.background = 'var(--bg-surface-hover)';
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.background = variants[variant].background;
      }}
      {...rest}
    >
      {loading ? (
        <>
          <span
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <span>Please wait…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;