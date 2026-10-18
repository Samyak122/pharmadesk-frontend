export function getDrugClassificationLabel(item = {}) {
  const isNarcotic = Boolean(item.is_narcotic ?? item.medicine?.is_narcotic ?? item.inventoryBatch?.medicine?.is_narcotic ?? false);
  const isScheduleH1 = Boolean(item.is_schedule_h1 ?? item.medicine?.is_schedule_h1 ?? item.inventoryBatch?.medicine?.is_schedule_h1 ?? false);
  return [
    isScheduleH1 ? 'Schedule H1' : '',
    isNarcotic ? 'Narcotic' : '',
  ].filter(Boolean).join(' · ') || 'Neither';
}

export function getInvoiceDrugClassification(item, settings) {
  if (!settings?.show_drug_classification) return null;
  const label = getDrugClassificationLabel(item);
  return label === 'Neither' ? 'Standard' : label;
}
