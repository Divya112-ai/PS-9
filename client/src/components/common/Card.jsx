const Card = ({ children, padding = 'md', style = {}, ...rest }) => {
  const paddings = {
    sm: 'var(--space-3)',
    md: 'var(--space-4)',
    lg: 'var(--space-6)',
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: paddings[padding],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;