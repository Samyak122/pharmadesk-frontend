import { useEffect, useMemo, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, CloudUpload, PlusCircle, RotateCcw, ScanText, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { SearchField } from '../components/common/SearchField';
import { useToast } from '../components/common/ToastProvider';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { confirmSupplierInvoice, createPurchase, extractSupplierInvoice, getSuppliers, listPurchases, searchMedicines } from '../services/pharmaService';
import { formatCurrency } from '../services/pharmaService';

const OCR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function PurchasesPage() {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [modalOpen, setModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [medicineResults, setMedicineResults] = useState([]);
  const [form, setForm] = useState({ supplier_id: '', invoice_no: '', notes: '', payment_status: 'Pending', medicine_id: '', batch_no: '', expiry_date: '', quantity: 1, unit_cost: '', selling_price: '', min_stock: 5, location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [ocrSelectedImage, setOcrSelectedImage] = useState(null);
  const [ocrRotation, setOcrRotation] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrRows, setOcrRows] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [purchaseData, supplierData] = await Promise.all([listPurchases(), getSuppliers()]);
        setPurchases(purchaseData || []);
        setSuppliers(supplierData || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Cannot connect to server.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (ocrSelectedImage?.previewUrl) {
        URL.revokeObjectURL(ocrSelectedImage.previewUrl);
      }
    };
  }, [ocrSelectedImage]);

  const resetOcrState = () => {
    setOcrSelectedImage(null);
    setOcrRotation(0);
    setOcrLoading(false);
    setOcrProgress(0);
    setOcrStatus('');
    setOcrError('');
    setOcrResult(null);
    setOcrRows([]);
    setIsDragging(false);
  };

  const searchMedicineCatalog = (value) => {
    setForm((prev) => ({ ...prev, medicine_id: '' }));
    setSearch(value);
    if (!value) {
      setMedicineResults([]);
      return;
    }
  };

  useEffect(() => {
    if (!debouncedSearch) {
      setMedicineResults([]);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      try {
        setSearching(true);
        const results = await searchMedicines(debouncedSearch);
        if (!cancelled) {
          setMedicineResults(results || []);
        }
      } catch {
        if (!cancelled) {
          setMedicineResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    };

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const validateImageFile = (file) => {
    if (!file) {
      return false;
    }

    const isSupported = OCR_ACCEPTED_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isSupported) {
      setOcrError('Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP bill image.');
      return false;
    }

    return true;
  };

  const prepareImageForOcr = (file, rotationDegrees) => new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const maxDimension = 2200;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('The browser could not prepare the invoice image.'));
        return;
      }

      const isPortrait = rotationDegrees % 180 !== 0;
      canvas.width = isPortrait ? height : width;
      canvas.height = isPortrait ? width : height;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((rotationDegrees * Math.PI) / 180);
      context.drawImage(image, -width / 2, -height / 2, width, height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      for (let index = 0; index < data.length; index += 4) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const adjusted = gray > 127 ? (gray - 127) * 1.45 + 127 : (gray - 127) * 0.75 + 127;
        const threshold = adjusted > 160 ? 255 : 0;
        data[index] = threshold;
        data[index + 1] = threshold;
        data[index + 2] = threshold;
      }

      context.putImageData(imageData, 0, 0);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/png'));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read the selected invoice image. Please try another file.'));
    };

    image.src = objectUrl;
  });

  const handleSelectedFile = (file) => {
    if (!validateImageFile(file)) return;

    const previewUrl = URL.createObjectURL(file);
    if (ocrSelectedImage?.previewUrl) {
      URL.revokeObjectURL(ocrSelectedImage.previewUrl);
    }

    setOcrSelectedImage({ file, previewUrl });
    setOcrRotation(0);
    setOcrError('');
    setOcrResult(null);
    setOcrRows([]);
  };

  const handleOcrScan = async () => {
    if (!ocrSelectedImage?.file) {
      setOcrError('Please upload or photograph the supplier invoice first.');
      return;
    }

    try {
      setOcrLoading(true);
      setOcrProgress(0);
      setOcrError('');
      setOcrRows([]);
      setOcrResult(null);
      setOcrStatus('Preparing image...');

      const processedImage = await prepareImageForOcr(ocrSelectedImage.file, ocrRotation);
      setOcrStatus('Reading invoice...');

      const worker = await Tesseract.recognize(processedImage, 'eng', {
        logger: (message) => {
          if (!message) return;
          if (message.status === 'preparing image') {
            setOcrStatus('Preparing image...');
          }
          if (message.status === 'recognizing text') {
            setOcrStatus('Reading invoice...');
            setOcrProgress(Math.round((message.progress || 0) * 100));
          }
          if (message.status === 'generating props') {
            setOcrStatus('Extracting medicine details...');
          }
        },
      });

      const extractedText = worker?.data?.text || '';
      if (!extractedText.trim()) {
        throw new Error('No readable text was detected. Please retake the photo with the full invoice clearly visible.');
      }

      setOcrStatus('Extracting medicine details...');
      setOcrProgress(100);

      const extracted = await extractSupplierInvoice({ image_text: extractedText });
      if (!extracted?.items?.length) {
        setOcrError(extracted?.warning || 'No medicine rows could be confidently extracted from this bill. Please retake the photo with the entire invoice clearly visible.');
        setOcrResult(extracted || null);
        setOcrRows([]);
        return;
      }

      setOcrResult(extracted);
      setOcrRows(extracted.items.map((row, index) => ({
        id: `${row.medicine_name || 'row'}-${index}-${Date.now()}`,
        medicine_name: row.medicine_name || '',
        batch_number: row.batch_number || '',
        expiry_date: row.expiry_date || '',
        quantity: Number(row.quantity || 0),
        free_quantity: Number(row.free_quantity || 0),
        mrp: Number(row.mrp || 0),
        purchase_rate: Number(row.purchase_rate || 0),
        gst_percentage: Number(row.gst_percentage || 0),
        hsn: row.hsn || '',
        status: row.validation?.valid ? 'Ready' : 'Needs review',
        warnings: row.validation?.message || 'Review required',
        validation: row.validation,
      })));
    } catch (err) {
      setOcrError(err.response?.data?.message || err.message || 'OCR failed. Please use a clearer supplier invoice image.');
      setOcrResult(null);
      setOcrRows([]);
    } finally {
      setOcrLoading(false);
      setOcrStatus('');
    }
  };

  const submitPurchase = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await createPurchase({
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        invoice_no: form.invoice_no,
        notes: form.notes,
        payment_status: form.payment_status,
        items: [{
          medicine_id: Number(form.medicine_id),
          batch_no: form.batch_no,
          expiry_date: form.expiry_date,
          quantity: Number(form.quantity),
          unit_cost: Number(form.unit_cost || 0),
          selling_price: Number(form.selling_price || 0),
          min_stock: Number(form.min_stock || 5),
          location: form.location,
        }],
      });
      window.dispatchEvent(new Event('pharmadesk:refresh-dashboard'));
      const purchaseData = await listPurchases();
      setPurchases(purchaseData || []);
      setModalOpen(false);
      setForm({ supplier_id: '', invoice_no: '', notes: '', payment_status: 'Pending', medicine_id: '', batch_no: '', expiry_date: '', quantity: 1, unit_cost: '', selling_price: '', min_stock: 5, location: '' });
      showToast('Purchase created and inventory updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to create purchase', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addOcrRow = () => {
    setOcrRows((prev) => [
      ...prev,
      {
        id: `new-row-${Date.now()}`,
        medicine_name: '',
        batch_number: '',
        expiry_date: '',
        quantity: 1,
        free_quantity: 0,
        mrp: 0,
        purchase_rate: 0,
        gst_percentage: 0,
        hsn: '',
        status: 'Needs review',
        warnings: 'New row: complete the medicine details before import.',
      },
    ]);
  };

  const deleteOcrRow = (index) => {
    setOcrRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const updateOcrRow = (index, field, value) => {
    setOcrRows((prevRows) => prevRows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };

  const confirmOcrImport = async () => {
    if (!ocrRows.length) {
      showToast('No invoice rows are available to import.', 'error');
      return;
    }

    const invalidRows = [];
    ocrRows.forEach((row, index) => {
      if (!String(row.medicine_name || '').trim()) invalidRows.push(`Row ${index + 1}: medicine name is required.`);
      if (!String(row.batch_number || '').trim()) invalidRows.push(`Row ${index + 1}: batch number is required.`);
      if (!String(row.expiry_date || '').trim()) invalidRows.push(`Row ${index + 1}: expiry date is required.`);
      if (!Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0) invalidRows.push(`Row ${index + 1}: quantity must be a valid positive number.`);
      if (!Number.isFinite(Number(row.mrp)) || Number(row.mrp) <= 0) invalidRows.push(`Row ${index + 1}: MRP must be valid.`);
      if (!Number.isFinite(Number(row.purchase_rate)) || Number(row.purchase_rate) <= 0) invalidRows.push(`Row ${index + 1}: purchase rate must be valid.`);
      if (row.gst_percentage !== '' && row.gst_percentage !== null && row.gst_percentage !== undefined && (!Number.isFinite(Number(row.gst_percentage)) || Number(row.gst_percentage) < 0 || Number(row.gst_percentage) > 100)) {
        invalidRows.push(`Row ${index + 1}: GST must be between 0 and 100.`);
      }
    });

    if (invalidRows.length) {
      showToast(invalidRows.slice(0, 3).join(' '), 'error');
      return;
    }

    try {
      setSubmitting(true);
      const result = await confirmSupplierInvoice({
        supplier: ocrResult?.supplier || {},
        items: ocrRows.map((row) => ({
          medicine_name: row.medicine_name,
          batch_number: row.batch_number,
          expiry_date: row.expiry_date,
          quantity: Number(row.quantity || 0),
          free_quantity: Number(row.free_quantity || 0),
          mrp: Number(row.mrp || 0),
          purchase_rate: Number(row.purchase_rate || 0),
          gst_percentage: Number(row.gst_percentage || 0),
          hsn: row.hsn || '',
        })),
      });

      const purchaseData = await listPurchases();
      setPurchases(purchaseData || []);
      setScanModalOpen(false);
      resetOcrState();
      showToast(`Confirmed ${result?.data?.imported_count || result?.imported_count || 0} OCR invoice rows and added them to inventory.`, 'success');
      window.dispatchEvent(new Event('pharmadesk:refresh-dashboard'));
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to confirm OCR invoice rows.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPurchases = useMemo(() => purchases.reduce((sum, purchase) => sum + Number(purchase.total_amount || 0), 0), [purchases]);

  return (
    <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Purchases</h2>
          <p className="text-sm text-slate-500">Create new purchase orders and let the backend update inventory automatically.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setScanModalOpen(true)} className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
            <ScanText size={16} /> Scan Supplier Bill
          </button>
          <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            <PlusCircle size={16} /> New Purchase
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Total purchase value: {formatCurrency(totalPurchases)}</div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <span>Loading purchases…</span>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {purchases.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Medicines</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.purchase_id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{purchase.supplier?.supplier_name || 'Unknown'}</td>
                  <td className="px-4 py-3">{purchase.invoice_no}</td>
                  <td className="px-4 py-3">{purchase.items?.length || 0}</td>
                  <td className="px-4 py-3">{formatCurrency(purchase.total_amount)}</td>
                  <td className="px-4 py-3">{purchase.payment_status}</td>
                  <td className="px-4 py-3">{purchase.purchase_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No Purchases" description="No purchase history is available from the backend." />
      )}

      <Modal
        open={scanModalOpen}
        title={ocrRows.length ? 'Review Supplier Bill' : 'Scan Supplier Bill'}
        description={ocrRows.length ? 'Review each invoice row before confirming inventory import.' : 'Upload or photograph the supplier invoice. We\'ll extract the medicine details automatically.'}
        onClose={() => {
          setScanModalOpen(false);
          resetOcrState();
        }}
      >
        {!ocrRows.length ? (
          <div className="space-y-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) handleSelectedFile(file);
              }}
              className={`rounded-[28px] border-2 border-dashed px-6 py-8 text-center ${isDragging ? 'border-slate-500 bg-slate-100' : 'border-slate-300 bg-slate-50'}`}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                <CloudUpload size={28} />
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-lg font-semibold text-slate-800">Upload supplier bill</h3>
                <p className="text-sm text-slate-500">Upload or photograph the supplier invoice. We&apos;ll extract the medicine details automatically.</p>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Upload Bill
                </button>
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <Camera size={16} /> Take Photo
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleSelectedFile(file);
                event.target.value = '';
              }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleSelectedFile(file);
                event.target.value = '';
              }} />
              <p className="mt-3 text-xs text-slate-400">Supported formats: JPG, JPEG, PNG, WEBP</p>
            </div>

            {ocrSelectedImage ? (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Bill Preview</h4>
                    <p className="text-xs text-slate-500">{ocrSelectedImage.file.name}</p>
                  </div>
                  <button type="button" onClick={() => setOcrRotation((prev) => (prev + 90) % 360)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                    <RotateCcw size={14} /> Rotate
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
                  <img
                    src={ocrSelectedImage.previewUrl}
                    alt="Supplier invoice preview"
                    className="mx-auto max-h-[300px] rounded-lg object-contain transition-transform duration-200"
                    style={{ transform: `rotate(${ocrRotation}deg)` }}
                  />
                </div>

                <button type="button" onClick={handleOcrScan} disabled={ocrLoading} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
                  {ocrLoading ? 'Scanning invoice...' : 'Scan Bill'}
                </button>
              </div>
            ) : null}

            {ocrLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{ocrStatus || 'Scanning invoice...'}</span>
                  <span>{ocrProgress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-slate-900 transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                </div>
              </div>
            ) : null}

            {ocrError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{ocrError}</div> : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Supplier</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{ocrResult?.supplier?.name || 'Supplier not detected'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-400">GSTIN</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{ocrResult?.supplier?.gstin || 'Not detected'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Invoice</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{ocrResult?.supplier?.invoice_number || 'Not detected'} / {ocrResult?.supplier?.invoice_date || 'Date not detected'}</p>
                </div>
              </div>
            </div>

            {ocrResult?.warning ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{ocrResult.warning}</div> : null}

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[1100px] w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2">Medicine</th>
                    <th className="px-2 py-2">Batch</th>
                    <th className="px-2 py-2">Expiry</th>
                    <th className="px-2 py-2">Qty</th>
                    <th className="px-2 py-2">Free</th>
                    <th className="px-2 py-2">MRP</th>
                    <th className="px-2 py-2">Rate</th>
                    <th className="px-2 py-2">GST</th>
                    <th className="px-2 py-2">HSN</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ocrRows.map((row, index) => {
                    const hasIssues = row.validation?.valid === false || row.warnings?.length;
                    const isMissing = !row.medicine_name || !row.batch_number || !row.expiry_date;

                    return (
                      <tr key={row.id || `${row.medicine_name || 'row'}-${index}`} className={`border-t border-slate-200 ${hasIssues ? 'bg-amber-50/40' : 'bg-white'}`}>
                        <td className="px-2 py-2">
                          <input
                            value={row.medicine_name || ''}
                            onChange={(event) => updateOcrRow(index, 'medicine_name', event.target.value)}
                            className={`w-28 rounded border px-2 py-1 ${isMissing || !row.medicine_name ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input value={row.batch_number || ''} onChange={(event) => updateOcrRow(index, 'batch_number', event.target.value)} className={`w-20 rounded border px-2 py-1 ${!row.batch_number ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`} />
                        </td>
                        <td className="px-2 py-2">
                          <input value={row.expiry_date || ''} onChange={(event) => updateOcrRow(index, 'expiry_date', event.target.value)} className={`w-20 rounded border px-2 py-1 ${!row.expiry_date ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`} />
                        </td>
                        <td className="px-2 py-2"><input type="number" value={row.quantity || 0} onChange={(event) => updateOcrRow(index, 'quantity', Number(event.target.value || 0))} className="w-14 rounded border border-slate-200 bg-white px-2 py-1" /></td>
                        <td className="px-2 py-2"><input type="number" value={row.free_quantity || 0} onChange={(event) => updateOcrRow(index, 'free_quantity', Number(event.target.value || 0))} className="w-14 rounded border border-slate-200 bg-white px-2 py-1" /></td>
                        <td className="px-2 py-2"><input type="number" value={row.mrp || 0} onChange={(event) => updateOcrRow(index, 'mrp', Number(event.target.value || 0))} className="w-16 rounded border border-slate-200 bg-white px-2 py-1" /></td>
                        <td className="px-2 py-2"><input type="number" value={row.purchase_rate || 0} onChange={(event) => updateOcrRow(index, 'purchase_rate', Number(event.target.value || 0))} className="w-16 rounded border border-slate-200 bg-white px-2 py-1" /></td>
                        <td className="px-2 py-2"><input type="number" value={row.gst_percentage || 0} onChange={(event) => updateOcrRow(index, 'gst_percentage', Number(event.target.value || 0))} className="w-14 rounded border border-slate-200 bg-white px-2 py-1" /></td>
                        <td className="px-2 py-2"><input value={row.hsn || ''} onChange={(event) => updateOcrRow(index, 'hsn', event.target.value)} className="w-16 rounded border border-slate-200 bg-white px-2 py-1" /></td>
                        <td className="px-2 py-2">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${row.status === 'Ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {row.status || 'Needs review'}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => deleteOcrRow(index)} className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700">
                            <Trash2 size={12} /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={addOcrRow} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Add missing medicine row</button>
              <div className="flex gap-3">
                <button type="button" onClick={() => {
                  setScanModalOpen(false);
                  resetOcrState();
                }} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="button" onClick={confirmOcrImport} disabled={submitting} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">{submitting ? 'Importing...' : 'Confirm & Import'}</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} title="New Purchase" description="Create a purchase and let the backend update inventory in one step." onClose={() => setModalOpen(false)}>
        <form onSubmit={submitPurchase} className="grid gap-3 md:grid-cols-2">
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
            <option value="">Select supplier</option>
            {suppliers.map((supplier) => (<option key={supplier.supplier_id} value={supplier.supplier_id}>{supplier.supplier_name}</option>))}
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Invoice number" value={form.invoice_no} onChange={(e) => setForm({ ...form, invoice_no: e.target.value })} />
          <div className="md:col-span-2">
            <SearchField value={search} onChange={searchMedicineCatalog} placeholder="Search medicine" loading={searching} />
          </div>
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" value={form.medicine_id} onChange={(e) => setForm({ ...form, medicine_id: e.target.value })}>
            <option value="">Select medicine</option>
            {medicineResults.map((medicine) => (<option key={medicine.medicine_id} value={medicine.medicine_id}>{medicine.medicine_name}</option>))}
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Batch number" value={form.batch_no} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Purchase price" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Selling price" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Minimum stock" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" placeholder="Rack location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <textarea className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button disabled={submitting} type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white md:col-span-2 disabled:opacity-70">{submitting ? 'Saving...' : 'Save Purchase'}</button>
        </form>
      </Modal>
    </div>
  );
}
