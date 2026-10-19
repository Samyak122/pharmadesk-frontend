import { describe, expect, it } from 'vitest';
import { calculateIndividualSaleUnits, calculateInvoiceTotals } from './billingUtils';
import { getDrugClassificationLabel, getInvoiceDrugClassification } from './drugClassification';
import { calculateReviewedIndividualUnits, createOcrReviewRow } from './purchaseUtils';

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

describe('individual stock unit billing', () => {
  it('converts full packs to individual units', () => {
    expect(calculateIndividualSaleUnits({ saleUnit: 'pack', quantity: 2, unitsPerPack: 10 })).toBe(20);
  });

  it('keeps loose unit sales as individual units', () => {
    expect(calculateIndividualSaleUnits({ saleUnit: 'loose', quantity: 2, unitsPerPack: 10 })).toBe(2);
  });

  it('supports a mixed pack and loose sale', () => {
    expect(calculateIndividualSaleUnits({ saleUnit: 'mixed', packQuantity: 1, looseQuantity: 2, unitsPerPack: 10 })).toBe(12);
  });

  it('rejects invalid quantities and pack sizes', () => {
    expect(() => calculateIndividualSaleUnits({ saleUnit: 'pack', quantity: 1, unitsPerPack: 0 })).toThrow();
    expect(() => calculateIndividualSaleUnits({ saleUnit: 'loose', quantity: -1, unitsPerPack: 10 })).toThrow();
    expect(() => calculateIndividualSaleUnits({ saleUnit: 'pack', quantity: 1.5, unitsPerPack: 10 })).toThrow();
  });
});

describe('drug classification labels', () => {
  it.each([
    [{ is_schedule_h1: true, is_narcotic: false }, 'Schedule H1'],
    [{ is_schedule_h1: false, is_narcotic: true }, 'Narcotic'],
    [{ is_schedule_h1: true, is_narcotic: true }, 'Schedule H1, Narcotic'],
    [{ is_schedule_h1: false, is_narcotic: false }, 'Regular'],
  ])('labels classification flags %j', (item, expected) => {
    expect(getDrugClassificationLabel(item)).toBe(expected);
  });

  it('only includes classification in invoices when the pharmacy setting enables it', () => {
    const item = { is_schedule_h1: true, is_narcotic: true };
    expect(getInvoiceDrugClassification(item, { show_drug_classification: false })).toBeNull();
    expect(getInvoiceDrugClassification(item, { show_drug_classification: true })).toBe('Schedule H1, Narcotic');
  });
});

describe('OCR purchase unit review', () => {
  it('defaults extracted rows to one unit per pack', () => {
    expect(createOcrReviewRow({ medicine: 'Example', quantity: 5 }, 0).units_per_pack).toBe(1);
  });

  it('includes free packs in the reviewed individual unit total', () => {
    expect(calculateReviewedIndividualUnits({ quantity: 5, free_quantity: 1, units_per_pack: 6 })).toBe(36);
  });

  it.each([0, -1, 1.5, 'invalid'])('rejects invalid pack sizes %j in the reviewed total', (unitsPerPack) => {
    expect(calculateReviewedIndividualUnits({ quantity: 5, free_quantity: 0, units_per_pack: unitsPerPack })).toBeNull();
  });
});
