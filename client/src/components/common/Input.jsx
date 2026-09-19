const Input = ({ label, error, hint, id, style = {}, ...rest }) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          width: '100%',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--bg-base)',
          border: `1px solid ${error ? 'var(--accent-danger)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.15s',
          ...style,
        }}
        {...rest}
      />
      {hint && !error && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
          {hint}
        </p>
      )}
      {error && (
        <p style={{ fontSize: '12px', color: 'var(--accent-danger)', marginTop: 'var(--space-1)' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;