export function getDrugClassificationLabel(item = {}) {
  const isNarcotic = Boolean(item.is_narcotic ?? item.medicine?.is_narcotic ?? item.inventoryBatch?.medicine?.is_narcotic ?? false);
  const isScheduleH1 = Boolean(item.is_schedule_h1 ?? item.medicine?.is_schedule_h1 ?? item.inventoryBatch?.medicine?.is_schedule_h1 ?? false);

  if (isScheduleH1 && isNarcotic) return 'Schedule H1, Narcotic';
  if (isScheduleH1) return 'Schedule H1';
  if (isNarcotic) return 'Narcotic';
  return 'Regular';
}

export function getInvoiceDrugClassification(item, settings) {
  if (!settings?.show_drug_classification) return null;
  return getDrugClassificationLabel(item);
}
