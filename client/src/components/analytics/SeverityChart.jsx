import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { severityColor } from '../../utils/formatters';

const SeverityChart = ({ data = [] }) => {
  if (data.length === 0) {
    return <p style={styles.empty}>No data yet</p>;
  }

  const chartData = data.map((item) => ({
    name: item.severity,
    value: item.count,
    color: severityColor(item.severity),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          label={(entry) => `${entry.name}: ${entry.value}`}
          labelLine={false}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="var(--bg-surface)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const styles = {
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
};

export default SeverityChart;