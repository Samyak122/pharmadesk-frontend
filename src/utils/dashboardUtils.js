export function formatMetricValue(type, value) {
  if (value === null || value === undefined) return '—';
  if (type === 'currency') return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  return Number(value || 0).toLocaleString('en-IN');
}
