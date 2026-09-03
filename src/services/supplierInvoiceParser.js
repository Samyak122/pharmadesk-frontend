const DEFAULT_CONFIDENCE_THRESHOLD = 0.75;

function clean(value) {
  return String(value ?? '').replace(/\uFFFD/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeMedicineName(value) {
  return clean(value).replace(/[^A-Za-z0-9%/().,\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function numberFrom(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeExpiry(value) {
  if (!value && value !== 0) return '';
  const text = String(value).trim().replace(/\s+/g, '').replace(/\//g, '-');
  const monthYear = text.match(/^(\d{4})-(\d{1,2})$/) || text.match(/^(\d{1,2})-(\d{4})$/);
  if (monthYear) {
    const year = monthYear[1].length === 4 ? monthYear[1] : monthYear[2];
    const month = (monthYear[1].length === 4 ? monthYear[2] : monthYear[1]).padStart(2, '0');
    return `${year}-${month}`;
  }
  const fullDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/) || text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (fullDate) {
    const year = fullDate[1].length === 4 ? fullDate[1] : fullDate[3];
    const month = fullDate[1].length === 4 ? fullDate[2] : fullDate[1];
    const day = fullDate[1].length === 4 ? fullDate[3] : fullDate[2];
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return text;
}

function isHeader(line) {
  return /(medicine|batch|expiry|qty|mrp|rate|gst|hsn)/i.test(clean(line)) && /(?:medicine|batch|expiry|qty)/i.test(clean(line));
}

function isTotal(line) {
  const text = clean(line);
  return /(total|grand total|amount|gst|cgst|sgst|discount|paid|balance)/i.test(text) && /\d/.test(text);
}

function parseSupplier(lines) {
  const supplier = { name: '', gstin: '', invoice_number: '', invoice_date: '' };
  const block = lines.join(' ');
  const gstin = block.match(/gstin\s*[:#-]?\s*([A-Z0-9]{10,20})/i) || block.match(/\b([A-Z0-9]{15})\b/);
  const invoice = block.match(/invoice\s*(?:no|number)?\s*[:#-]?\s*([A-Z0-9\-/]+)\b/i) || block.match(/bill\s*(?:no|number)?\s*[:#-]?\s*([A-Z0-9\-/]+)\b/i);
  const date = block.match(/(?:invoice\s*)?date\s*[:#-]?\s*([0-9]{2}[/-][0-9]{2}[/-][0-9]{2,4}|[0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2})/i);
  if (gstin) supplier.gstin = gstin[1].toUpperCase();
  if (invoice) supplier.invoice_number = invoice[1].trim();
  if (date) supplier.invoice_date = normalizeExpiry(date[1]);
  const supplierLine = lines.find((line) => line.length > 3 && /[A-Za-z]/.test(line) && !isHeader(line) && !isTotal(line) && !/^gstin|^invoice/i.test(line));
  if (supplierLine) supplier.name = supplierLine.replace(/\s*(gstin|invoice).*$/i, '').trim();
  return supplier;
}

function parseRow(line) {
  const cleaned = clean(line).replace(/\s*\|\s*/g, ' ');
  if (!cleaned || cleaned.length < 8 || isHeader(cleaned) || isTotal(cleaned)) return null;
  const patterns = [
    /^(.+?)\s+([A-Za-z0-9\-/.]+)\s+(\d{4}[-/]\d{1,2}|\d{1,2}[-/]\d{4}|\d{2}[-/]\d{2})\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(\d{4,8})?$/i,
    /^(.+?)\s+([A-Za-z0-9\-/.]+)\s+(\d{4}[-/]\d{1,2}|\d{1,2}[-/]\d{4}|\d{2}[-/]\d{2})\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(\d{4,8})?$/i,
    /^(.+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(\d{4,8})?$/i,
  ];
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (!match) continue;
    const hasExpiry = pattern === patterns[0] || pattern === patterns[1];
    const medicineName = normalizeMedicineName(match[1]);
    const batchNumber = hasExpiry ? clean(match[2]) : '';
    const expiryDate = hasExpiry ? normalizeExpiry(match[3]) : '';
    const quantity = numberFrom(match[hasExpiry ? 4 : 2]);
    const mrp = numberFrom(match[hasExpiry ? 5 : 3]);
    const purchaseRate = numberFrom(match[hasExpiry ? 6 : 4]);
    const gst = numberFrom(match[hasExpiry ? 7 : 5]);
    const hsn = match[hasExpiry ? 8 : 6] || '';
    if (medicineName && quantity !== null && mrp !== null && purchaseRate !== null) return { medicine_name: medicineName, batch_number: batchNumber, expiry_date: expiryDate, quantity, mrp, purchase_rate: purchaseRate, gst_percentage: gst ?? 0, hsn: clean(hsn) };
  }
  return null;
}

function validate(row) {
  const errors = {};
  if (!row.medicine_name) errors.medicine_name = 'Medicine name is missing.';
  if (!row.batch_number) errors.batch_number = 'Batch number is missing.';
  if (!row.expiry_date) errors.expiry_date = 'Expiry date is missing or not in a valid date format.';
  if (!Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0) errors.quantity = 'Quantity must be a valid positive number.';
  if (!Number.isFinite(Number(row.mrp)) || Number(row.mrp) <= 0) errors.mrp = 'MRP must be greater than zero.';
  if (!Number.isFinite(Number(row.purchase_rate)) || Number(row.purchase_rate) <= 0) errors.purchase_rate = 'Purchase rate must be greater than zero.';
  const valid = !Object.keys(errors).length;
  return { valid, errors, normalized: row, confidence: valid ? 0.99 : 0.65, message: valid ? 'Row passed validation.' : `Row needs pharmacist review before import. ${Object.entries(errors).map(([key, message]) => `${key.replace(/_/g, ' ')}: ${message}`).join(' | ')}` };
}

function similarityScore(left, right) {
  const source = normalizeMedicineName(left).toUpperCase();
  const target = normalizeMedicineName(right).toUpperCase();
  if (!source || !target) return 0;
  if (source === target) return 1;
  const previous = Array.from({ length: target.length + 1 }, (_, index) => index);
  for (let row = 1; row <= source.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= target.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(previous[column] + 1, previous[column - 1] + 1, diagonal + (source[row - 1] === target[column - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return 1 - previous[target.length] / Math.max(source.length, target.length);
}

export function findMedicineMatch(name, catalog = []) {
  const best = catalog.reduce((current, item) => {
    const score = similarityScore(name, item?.medicine_name || '');
    return score > (current?.score || 0) ? { score, medicine_name: item.medicine_name } : current;
  }, null);
  return !best || best.score < 0.72 ? { matched: false, suggestion: '', similarity: best?.score || 0 } : { matched: true, suggestion: best.medicine_name, similarity: Number(best.score.toFixed(3)) };
}

export function extractSupplierInvoiceData(rawText, catalog = []) {
  const text = clean(rawText);
  const lines = String(rawText || '').split(/\r?\n/).map(clean).filter((line) => line && !isTotal(line));
  const items = [];
  const seen = new Set();
  lines.forEach((line) => {
    const candidate = parseRow(line);
    if (!candidate) return;
    const key = `${candidate.medicine_name}|${candidate.batch_number}|${candidate.expiry_date}|${candidate.quantity}`;
    if (seen.has(key)) return;
    seen.add(key);
    const validation = validate(candidate);
    const catalogMatch = findMedicineMatch(candidate.medicine_name, catalog);
    items.push({ ...candidate, validation, confidence: { medicine_name: { value: candidate.medicine_name, confidence: validation.confidence } }, possible_match: catalogMatch.matched ? catalogMatch.suggestion : '', catalog_match: catalogMatch, review_required: !validation.valid || validation.confidence < DEFAULT_CONFIDENCE_THRESHOLD });
  });
  const qualityOk = text.length >= 80 && /[A-Za-z]/.test(text);
  return { supplier: parseSupplier(lines), items, quality_ok: qualityOk, warning: qualityOk ? '' : 'Image quality is too low to reliably read the invoice. Please take a clearer photo with the complete bill visible.', threshold: DEFAULT_CONFIDENCE_THRESHOLD };
}