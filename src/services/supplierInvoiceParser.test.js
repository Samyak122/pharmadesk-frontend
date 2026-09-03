import { describe, expect, it } from 'vitest';
import { extractSupplierInvoiceData } from './supplierInvoiceParser';

function word(text, left, top = 100, confidence = 94) {
  return { text, confidence, bbox: { x0: left, y0: top, x1: left + Math.max(8, text.length * 7), y1: top + 14 } };
}

function ocr(lines) {
  return { text: lines.map((line) => line.map((item) => item.text).join(' ')).join('\n'), lines: lines.map((line, index) => ({ id: index, words: line })) };
}

describe('format-independent supplier invoice parser', () => {
  it('maps reordered Product, Qty, Rate, Batch and Exp columns by coordinates', () => {
    const result = extractSupplierInvoiceData(ocr([
      [word('Supplier', 10, 10)],
      [word('Product', 10), word('Qty', 150), word('Rate', 230), word('Batch', 310), word('Exp', 400)],
      [word('AMOXICILLIN', 10, 130), word('10', 150, 130), word('42.50', 230, 130), word('AB12', 310, 130), word('09/2027', 400, 130)],
    ]), [{ medicine_name: 'AMOXICILLIN' }]);

    expect(result.strategy).toBe('table-header');
    expect(result.items[0]).toMatchObject({ medicine_name: 'AMOXICILLIN', quantity: 10, purchase_rate: 42.5, batch_number: 'AB12', expiry_date: '2027-09', gst_percentage: '', hsn: '' });
    expect(result.items[0].possible_match).toBe('AMOXICILLIN');
  });

  it('supports Description, Units, MRP, PTR and Lot aliases without HSN', () => {
    const result = extractSupplierInvoiceData(ocr([
      [word('MEDICAL HOUSE', 10, 10)],
      [word('Description', 10), word('Units', 180), word('MRP', 250), word('PTR', 320), word('Lot No', 390), word('Expiry Date', 470)],
      [word('Cough', 10, 130), word('Syrup', 55, 130), word('5', 180, 130), word('100', 250, 130), word('65', 320, 130), word('LOT9', 390, 130), word('2028-03-31', 470, 130)],
    ]));

    expect(result.items[0]).toMatchObject({ medicine_name: 'Cough Syrup', quantity: 5, mrp: 100, purchase_rate: 65, batch_number: 'LOT9', expiry_date: '2028-03-31', hsn: '' });
  });

  it('supports HSN-first layouts and leaves absent GST blank', () => {
    const result = extractSupplierInvoiceData(ocr([
      [word('INVOICE', 10, 10), word('DATE:', 100, 10), word('31/12/2026', 160, 10)],
      [word('HSN', 10), word('Item Name', 80), word('Pack', 220), word('Batch No', 280), word('Qty', 370), word('MRP', 430), word('Sale Rate', 500), word('Exp', 590)],
      [word('3004', 10, 130), word('PARACETAMOL', 80, 130), word('10', 220, 130), word('P-77', 280, 130), word('2', 370, 130), word('50', 430, 130), word('35', 500, 130), word('12/28', 590, 130)],
    ]));

    expect(result.items[0]).toMatchObject({ hsn: '3004', medicine_name: 'PARACETAMOL', batch_number: 'P-77', quantity: 2, mrp: 50, purchase_rate: 35, expiry_date: '12-28', gst_percentage: '' });
    expect(result.supplier.gstin).toBe('');
  });
});
