const DEFAULT_CONFIDENCE_THRESHOLD = 0.75;

const ALIASES = {
  medicine_name: ['product', 'product description', 'description', 'item', 'item name', 'medicine', 'particulars'],
  batch_number: ['batch', 'batch no', 'batch number', 'lot', 'lot no', 'lot number'],
  expiry_date: ['exp', 'expiry', 'exp date', 'expiry date', 'exp dt'],
  quantity: ['qty', 'quantity', 'units', 'nos', 'no'],
  free_quantity: ['free', 'free qty', 'bonus', 'scheme'],
  mrp: ['mrp', 'm r p', 'maximum retail price'],
  purchase_rate: ['rate', 'purchase rate', 'ptr', 'cost', 'basic rate'],
  pack: ['pack', 'packing', 'size'],
  sale_rate: ['sale rate'],
  gst_percentage: ['gst', 'gst%', 'tax', 'tax%', 'cgst', 'sgst', 'igst'],
  hsn: ['hsn', 'hsn code', 'hsn/sac'],
  amount: ['amount', 'value', 'net amount', 'line total', 'total'],
};

const clean = (value) => String(value ?? '').replace(/\uFFFD/g, '').replace(/\s+/g, ' ').trim();
const normalizeName = (value) => clean(value).replace(/[^A-Za-z0-9%/().,\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
const aliasKey = (value) => clean(value).toLowerCase().replace(/[.:/%]/g, ' ').replace(/\s+/g, ' ').trim();
const numberFrom = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

function normalizeExpiry(value) {
  const text = clean(value).replace(/\s+/g, '').replace(/[/.]/g, '-');
  if (!text) return '';
  const monthYear = text.match(/^(\d{4})-(\d{1,2})$/) || text.match(/^(\d{1,2})-(\d{4})$/);
  if (monthYear) return `${monthYear[1].length === 4 ? monthYear[1] : monthYear[2]}-${(monthYear[1].length === 4 ? monthYear[2] : monthYear[1]).padStart(2, '0')}`;
  const fullDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/) || text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (fullDate) return `${fullDate[1].length === 4 ? fullDate[1] : fullDate[3]}-${String(fullDate[1].length === 4 ? fullDate[2] : fullDate[1]).padStart(2, '0')}-${String(fullDate[1].length === 4 ? fullDate[3] : fullDate[2]).padStart(2, '0')}`;
  return text;
}

function box(word) {
  const source = word?.bbox || word || {};
  return { left: Number(source.x0 ?? source.left ?? 0), top: Number(source.y0 ?? source.top ?? 0), right: Number(source.x1 ?? source.right ?? source.x0 ?? 0), bottom: Number(source.y1 ?? source.bottom ?? source.y0 ?? 0) };
}

function wordsFrom(input) {
  const lines = input?.lines || input?.data?.lines || [];
  const words = lines.flatMap((line) => (line.words || []).map((word) => ({ text: clean(word.text), confidence: Number(word.confidence ?? line.confidence ?? 0), bbox: box(word), lineId: line.id ?? line.line_id })));
  const direct = input?.words || input?.data?.words || [];
  return (words.length ? words : direct.map((word) => ({ text: clean(word.text), confidence: Number(word.confidence ?? 0), bbox: box(word), lineId: word.line_id }))).filter((word) => word.text);
}

function groupLines(words) {
  const groups = [];
  [...words].sort((a, b) => a.bbox.top - b.bbox.top || a.bbox.left - b.bbox.left).forEach((word) => {
    let line = word.lineId !== undefined ? groups.find((item) => item.id === word.lineId) : null;
    if (!line) line = groups.find((item) => Math.abs(item.top - word.bbox.top) <= Math.max(8, word.bbox.bottom - word.bbox.top) * 0.6);
    if (!line) { line = { id: word.lineId ?? groups.length, top: word.bbox.top, words: [] }; groups.push(line); }
    line.words.push(word);
  });
  return groups.map((line) => ({ ...line, words: line.words.sort((a, b) => a.bbox.left - b.bbox.left), text: line.words.map((word) => word.text).join(' ') })).sort((a, b) => a.top - b.top);
}

function aliasFor(text) {
  const key = aliasKey(text);
  return Object.entries(ALIASES).find(([, aliases]) => aliases.some((alias) => aliasKey(alias) === key))?.[0] || '';
}

function detectHeader(lines) {
  let best = null;
  lines.forEach((line, index) => {
    const columns = [];
    line.words.forEach((word, wordIndex) => {
      for (let count = Math.min(3, line.words.length - wordIndex); count >= 1; count -= 1) {
        const selected = line.words.slice(wordIndex, wordIndex + count);
        const field = aliasFor(selected.map((item) => item.text).join(' '));
        if (field) {
          columns.push({ field, x: (selected[0].bbox.left + selected[selected.length - 1].bbox.right) / 2, confidence: Math.min(...selected.map((item) => item.confidence)) });
          break;
        }
      }
    });
    const unique = columns.filter((column, columnIndex, all) => all.findIndex((item) => item.field === column.field) === columnIndex);
    if (unique.length >= 2 && (!best || unique.length > best.columns.length)) best = { index, columns: unique };
  });
  return best;
}

function isTotal(text) { return /(grand total|total amount|subtotal|amount payable|balance|discount|round off)/i.test(text) && /\d/.test(text); }
function cellValue(field, words) {
  const text = words.map((word) => word.text).join(' ');
  if (!text) return '';
  if (field === 'medicine_name') return normalizeName(text);
  if (field === 'expiry_date') return normalizeExpiry(text.match(/\d{4}[\-/]\d{1,2}(?:[\-/]\d{1,2})?|\d{1,2}[\-/]\d{4}|\d{1,2}[\-/]\d{1,2}/)?.[0] || text);
  if (field === 'batch_number') return clean(text);
  if (field === 'hsn') return text.match(/\d{4,8}/)?.[0] || '';
  return numberFrom(text) ?? '';
}

function parseWithHeader(lines, header) {
  const columns = [...header.columns].sort((a, b) => a.x - b.x);
  return lines.slice(header.index + 1).filter((line) => !isTotal(line.text) && line.words.filter((word) => /\d/.test(word.text)).length >= 2).map((line) => {
    const cells = Object.fromEntries(columns.map((column) => [column.field, []]));
    line.words.forEach((word) => {
      const x = (word.bbox.left + word.bbox.right) / 2;
      const nearest = columns.reduce((current, column) => Math.abs(column.x - x) < Math.abs(current.x - x) ? column : current, columns[0]);
      cells[nearest.field].push(word);
    });
    const row = { medicine_name: '', batch_number: '', expiry_date: '', quantity: '', free_quantity: '', mrp: '', purchase_rate: '', gst_percentage: '', hsn: '', amount: '', pack: '' };
    Object.entries(cells).forEach(([field, words]) => { row[field] = cellValue(field, words); });
    if (!row.purchase_rate && cells.sale_rate) row.purchase_rate = cellValue('purchase_rate', cells.sale_rate);
    return { ...row, source: line };
  });
}

function parseRepeatedRows(lines) {
  return lines.filter((line) => !isTotal(line.text)).flatMap((line) => {
    const dateWord = line.words.find((word) => /\d{1,4}[\-/]\d{1,2}/.test(word.text));
    const numbers = line.words.filter((word) => /^\d+(?:[,.]\d+)?$/.test(word.text.replace(/,/g, '')));
    if (!dateWord || numbers.length < 3) return [];
    const dateIndex = line.words.indexOf(dateWord);
    return [{ medicine_name: normalizeName(line.words.slice(0, Math.max(1, dateIndex - 1)).map((word) => word.text).join(' ')), batch_number: line.words[dateIndex - 1]?.text || '', expiry_date: normalizeExpiry(dateWord.text), quantity: numberFrom(numbers[0].text) ?? '', free_quantity: '', mrp: numberFrom(numbers[1].text) ?? '', purchase_rate: numberFrom(numbers[2].text) ?? '', gst_percentage: numberFrom(numbers[3]?.text) ?? '', hsn: '', amount: '', source: line }];
  });
}

function validate(row) {
  const errors = {};
  if (!row.medicine_name) errors.medicine_name = 'Medicine name is missing.';
  if (row.quantity !== '' && (!Number.isInteger(Number(row.quantity)) || Number(row.quantity) < 0)) errors.quantity = 'Quantity must be a non-negative integer.';
  if (row.free_quantity !== '' && (!Number.isInteger(Number(row.free_quantity)) || Number(row.free_quantity) < 0)) errors.free_quantity = 'Free quantity must be a non-negative integer.';
  if (row.mrp !== '' && Number(row.mrp) <= 0) errors.mrp = 'MRP must be greater than zero.';
  if (row.purchase_rate !== '' && Number(row.purchase_rate) <= 0) errors.purchase_rate = 'Rate must be greater than zero.';
  if (row.gst_percentage !== '' && (Number(row.gst_percentage) < 0 || Number(row.gst_percentage) > 100)) errors.gst_percentage = 'GST must be between 0 and 100.';
  return { valid: !Object.keys(errors).length, errors, normalized: row, confidence: Math.max(0.35, 0.98 - Object.keys(errors).length * 0.12), message: Object.keys(errors).length ? `Needs verification: ${Object.values(errors).join(' ')}` : 'Row passed validation.' };
}

function similarity(left, right) {
  const a = normalizeName(left).toUpperCase(); const b = normalizeName(right).toUpperCase();
  if (!a || !b) return 0;
  const costs = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) { let diagonal = costs[0]; costs[0] = row; for (let column = 1; column <= b.length; column += 1) { const above = costs[column]; costs[column] = Math.min(costs[column] + 1, costs[column - 1] + 1, diagonal + (a[row - 1] === b[column - 1] ? 0 : 1)); diagonal = above; } }
  return 1 - costs[b.length] / Math.max(a.length, b.length);
}

export function findMedicineMatch(name, catalog = []) {
  const best = catalog.reduce((current, item) => { const score = similarity(name, item?.medicine_name || ''); return score > (current?.score || 0) ? { score, medicine_name: item.medicine_name } : current; }, null);
  return !best || best.score < 0.72 ? { matched: false, suggestion: '', similarity: best?.score || 0 } : { matched: true, suggestion: best.medicine_name, similarity: Number(best.score.toFixed(3)) };
}

export function extractSupplierInvoiceData(input, catalog = []) {
  const rawText = typeof input === 'string' ? input : input?.text || input?.data?.text || wordsFrom(input).map((word) => word.text).join(' ');
  const positionedLines = groupLines(typeof input === 'string' ? [] : wordsFrom(input));
  const lines = positionedLines.length ? positionedLines : String(rawText).split(/\r?\n/).map((text, index) => ({ id: index, top: index, text: clean(text), words: clean(text).split(/\s+/).map((word, wordIndex) => ({ text: word, confidence: 60, bbox: { left: wordIndex * 10, right: wordIndex * 10 + 8, top: index, bottom: index + 1 } })) }));
  const header = detectHeader(lines); const candidates = header ? parseWithHeader(lines, header) : parseRepeatedRows(lines); const seen = new Set();
  const items = candidates.filter((row) => { const key = `${row.medicine_name}|${row.batch_number}|${row.expiry_date}|${row.quantity}`; if (!row.medicine_name || seen.has(key)) return false; seen.add(key); return true; }).map((row) => { const validation = validate(row); const match = findMedicineMatch(row.medicine_name, catalog); const average = ((row.source?.words || []).reduce((sum, word) => sum + Number(word.confidence || 0), 0) / Math.max(1, row.source?.words?.length || 1)) / 100; const confidence = Object.fromEntries(Object.keys(row).filter((key) => key !== 'source').map((key) => [key, { value: row[key], confidence: row[key] === '' ? 0 : Math.min(0.99, average || validation.confidence) }])); return { ...row, source: undefined, validation, confidence, possible_match: match.matched ? match.suggestion : '', catalog_match: match, review_required: !validation.valid || validation.confidence < DEFAULT_CONFIDENCE_THRESHOLD }; });
  const text = clean(rawText); const candidatesForGstin = [...text.matchAll(/\b[A-Z0-9]{15}\b/gi)].map((match) => match[0].toUpperCase()); const supplier = { name: '', gstin: text.match(/gstin\s*[:#-]?\s*([A-Z0-9]{10,20})/i)?.[1]?.toUpperCase() || '', invoice_number: text.match(/(?:invoice|bill)\s*(?:no|number)?\s*[:#-]?\s*([A-Z0-9\-/]+)/i)?.[1] || '', invoice_date: normalizeExpiry(text.match(/(?:invoice\s*)?date\s*[:#-]?\s*([0-9]{1,4}[/-][0-9]{1,4}[/-][0-9]{1,4}|[0-9]{1,2}[/-]\d{4})/i)?.[1] || '') };
  supplier.gstin_candidates = [...new Set(candidatesForGstin)];
  const headerLine = lines[header?.index ?? 0]; supplier.name = headerLine?.text && !/(invoice|gstin|date|product|description|item)/i.test(headerLine.text) ? headerLine.text : '';
  const qualityOk = text.length >= 40 && /[A-Za-z]/.test(text);
  return { supplier, items, quality_ok: qualityOk, warning: qualityOk ? '' : 'Image quality is too low to reliably read the invoice. Please take a clearer photo with the complete bill clearly visible.', threshold: DEFAULT_CONFIDENCE_THRESHOLD, strategy: header ? 'table-header' : 'repeated-row' };
}
