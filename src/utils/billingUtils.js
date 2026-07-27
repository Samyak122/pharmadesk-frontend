export function calculateInvoiceTotals(items = [], gstPercent = 0, discountAmount = 0) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0);
  const normalizedDiscount = Number(discountAmount || 0);
  const taxableAmount = Math.max(0, subtotal - normalizedDiscount);
  const gstAmount = Number(((taxableAmount * Number(gstPercent || 0)) / 100).toFixed(2));
  const totalAmount = Number((taxableAmount + gstAmount).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(normalizedDiscount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    gstAmount,
    totalAmount,
  };
}
