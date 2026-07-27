import { describe, expect, it } from 'vitest';
import { formatMetricValue } from './dashboardUtils';

describe('formatMetricValue', () => {
  it('uses currency formatting for financial metrics only', () => {
    expect(formatMetricValue('currency', 12450)).toBe('₹12,450');
    expect(formatMetricValue('count', 7)).toBe('7');
    expect(formatMetricValue('count', 0)).toBe('0');
  });
});
