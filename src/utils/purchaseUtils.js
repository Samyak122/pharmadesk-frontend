export function createOcrReviewRow(row, index) {
  const ready = Boolean(row.quantity || row.mrp || row.rate);
  return {
    id: `${row.medicine || 'row'}-${index}-${Date.now()}`,
    medicine_name: row.medicine || '',
    batch_number: row.batch || '',
    expiry_date: row.expiry || '',
    quantity: row.quantity ?? '',
    free_quantity: row.free ?? 0,
    units_per_pack: 1,
    mrp: row.mrp ?? '',
    purchase_rate: row.rate ?? '',
    gst_percentage: row.gst ?? '',
    hsn: row.hsn || '',
    amount: row.amount ?? '',
    status: ready ? 'Ready' : 'Needs review',
    warnings: ready ? 'Review before importing.' : 'Missing critical invoice data.',
  };
}

export function calculateReviewedIndividualUnits(row) {
  const quantity = Number(row.quantity);
  const freeQuantity = Number(row.free_quantity);
  const unitsPerPack = Number(row.units_per_pack);
  if (
    !Number.isInteger(quantity)
    || quantity <= 0
    || !Number.isInteger(freeQuantity)
    || freeQuantity < 0
    || !Number.isInteger(unitsPerPack)
    || unitsPerPack <= 0
  ) {
    return null;
  }
  return (quantity + freeQuantity) * unitsPerPack;
}
