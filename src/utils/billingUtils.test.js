import { describe, expect, it } from 'vitest';
import { calculateInvoiceTotals } from './billingUtils';

describe('calculateInvoiceTotals', () => {
  it('keeps the full subtotal when there is no discount', () => {
    expect(calculateInvoiceTotals([{ quantity: 1, unit_price: 15 }], 0, 0)).toEqual({
      subtotal: 15,
      discountAmount: 0,
      taxableAmount: 15,
      gstAmount: 0,
      totalAmount: 15,
    });
  });

  it('computes subtotal, discount, GST, and total correctly', () => {
    const totals = calculateInvoiceTotals([
      { quantity: 2, unit_price: 50 },
      { quantity: 1, unit_price: 30 },
    ], 10, 5);

    expect(totals.subtotal).toBe(130);
    expect(totals.discountAmount).toBe(5);
    expect(totals.taxableAmount).toBe(125);
    expect(totals.gstAmount).toBe(12.5);
    expect(totals.totalAmount).toBe(137.5);
  });
});
