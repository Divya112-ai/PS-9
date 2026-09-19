import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TYPE_COLORS = {
  fire: '#dc2626',
  flood: '#3b82f6',
  medical: '#22c55e',
  accident: '#f59e0b',
  industrial: '#8b5cf6',
  structural: '#a16207',
  other: '#64748b',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const { type, count } = payload[0].payload;
  return (
    <div style={styles.tooltip}>
      <strong style={{ textTransform: 'capitalize' }}>{type}</strong>
      <div>{count} incident{count !== 1 ? 's' : ''}</div>
    </div>
  );
};

const IncidentsByTypeChart = ({ data = [] }) => {
  if (data.length === 0) {
    return <p style={styles.empty}>No data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="type"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--border-default)' }}
          tickLine={false}
          tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || '#64748b'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const styles = {
  tooltip: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: '12px',
    color: 'var(--text-primary)',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
};

export default IncidentsByTypeChart;