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

export function calculateIndividualSaleUnits({ saleUnit, quantity, unitsPerPack = 1, packQuantity = 0, looseQuantity = 0 }) {
  const unitsPerPackage = Number(unitsPerPack);
  if (!Number.isInteger(unitsPerPackage) || unitsPerPackage <= 0) {
    throw new Error('Units per Pack must be a positive whole number.');
  }

  if (saleUnit === 'mixed') {
    const packs = Number(packQuantity);
    const loose = Number(looseQuantity);
    if (!Number.isInteger(packs) || packs < 0 || !Number.isInteger(loose) || loose < 0 || packs + loose <= 0) {
      throw new Error('Mixed sales need non-negative whole pack and loose quantities, with at least one unit.');
    }
    return packs * unitsPerPackage + loose;
  }

  const saleQuantity = Number(quantity);
  if (!Number.isInteger(saleQuantity) || saleQuantity <= 0) {
    throw new Error('Sale quantity must be a positive whole number.');
  }
  return saleUnit === 'pack' ? saleQuantity * unitsPerPackage : saleQuantity;
}
