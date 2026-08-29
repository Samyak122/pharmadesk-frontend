import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, ScanText } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { SearchField } from '../components/common/SearchField';
import { useToast } from '../components/common/ToastProvider';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { confirmSupplierInvoice, createPurchase, extractSupplierInvoice, getSuppliers, listPurchases, searchMedicines } from '../services/pharmaService';
import { formatCurrency } from '../services/pharmaService';

export function PurchasesPage() {
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
  const [ocrInput, setOcrInput] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrRows, setOcrRows] = useState([]);
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

  const totalPurchases = useMemo(() => purchases.reduce((sum, purchase) => sum + Number(purchase.total_amount || 0), 0), [purchases]);

  const handleOcrExtract = async (event) => {
    event.preventDefault();
    if (!ocrInput.trim()) {
      setOcrError('Paste the supplier invoice text or upload a readable invoice image before scanning.');
      return;
    }

    try {
      setOcrLoading(true);
      setOcrError('');
      const result = await extractSupplierInvoice({ image_text: ocrInput });
      if (!result?.items?.length) {
        setOcrError(result?.warning || 'No medicine items could be detected. Please upload a clearer image.');
        setOcrResult(result || null);
        setOcrRows([]);
        return;
      }

      setOcrResult(result);
      setOcrRows(result.items.map((item) => ({
        ...item,
        medicine_name: item.medicine_name || '',
        batch_number: item.batch_number || '',
        expiry_date: item.expiry_date || '',
        quantity: Number(item.quantity || 0),
        mrp: Number(item.mrp || 0),
        purchase_rate: Number(item.purchase_rate || 0),
        gst_percentage: Number(item.gst_percentage || 0),
        hsn: item.hsn || '',
      })));
    } catch (err) {
      setOcrError(err.response?.data?.message || 'Unable to extract invoice data.');
      setOcrResult(null);
      setOcrRows([]);
    } finally {
      setOcrLoading(false);
    }
  };

  const updateOcrRow = (index, field, value) => {
    setOcrRows((prevRows) => prevRows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };

  const handleOcrConfirm = async () => {
    if (!ocrRows.length) {
      showToast('No OCR rows are available to confirm.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const result = await confirmSupplierInvoice({
        supplier: ocrResult?.supplier || {},
        items: ocrRows.map((row) => ({
          ...row,
          quantity: Number(row.quantity || 0),
          mrp: Number(row.mrp || 0),
          purchase_rate: Number(row.purchase_rate || 0),
          gst_percentage: Number(row.gst_percentage || 0),
          expiry_date: row.expiry_date || '',
          batch_number: row.batch_number || '',
          medicine_name: row.medicine_name || '',
        })),
      });

      const purchaseData = await listPurchases();
      setPurchases(purchaseData || []);
      setScanModalOpen(false);
      setOcrInput('');
      setOcrResult(null);
      setOcrRows([]);
      setModalOpen(false);
      showToast(`Confirmed ${result?.imported_count || 0} OCR invoice rows and added them to inventory.`, 'success');
      window.dispatchEvent(new Event('pharmadesk:refresh-dashboard'));
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to confirm OCR invoice rows.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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

      <Modal open={scanModalOpen} title="Scan Supplier Bill" description="Paste invoice text or upload the bill into the OCR flow for review before importing." onClose={() => setScanModalOpen(false)}>
        <div className="space-y-4">
          <form onSubmit={handleOcrExtract} className="space-y-3">
            <textarea className="min-h-[180px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Paste invoice text here (medicine, batch, expiry, qty, rate, GST)" value={ocrInput} onChange={(e) => setOcrInput(e.target.value)} />
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={ocrLoading} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">{ocrLoading ? 'Extracting...' : 'Extract medicine rows'}</button>
              <p className="text-xs text-slate-500">Image upload and camera capture are supported by the OCR service layer; the current UI accepts invoice text for review.</p>
            </div>
          </form>

          {ocrError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{ocrError}</div> : null}

          {ocrResult && !ocrResult.quality_ok ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{ocrResult.warning}</div> : null}

          {ocrRows.length ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-2 py-2">Medicine</th>
                      <th className="px-2 py-2">Batch</th>
                      <th className="px-2 py-2">Expiry</th>
                      <th className="px-2 py-2">Qty</th>
                      <th className="px-2 py-2">MRP</th>
                      <th className="px-2 py-2">Rate</th>
                      <th className="px-2 py-2">GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocrRows.map((row, index) => (
                      <tr key={`${row.medicine_name || 'row'}-${index}`} className="border-t border-slate-200">
                        <td className="px-2 py-2"><input className="w-28 rounded border border-slate-200 px-2 py-1" value={row.medicine_name} onChange={(e) => updateOcrRow(index, 'medicine_name', e.target.value)} /></td>
                        <td className="px-2 py-2"><input className="w-20 rounded border border-slate-200 px-2 py-1" value={row.batch_number} onChange={(e) => updateOcrRow(index, 'batch_number', e.target.value)} /></td>
                        <td className="px-2 py-2"><input className="w-20 rounded border border-slate-200 px-2 py-1" value={row.expiry_date} onChange={(e) => updateOcrRow(index, 'expiry_date', e.target.value)} /></td>
                        <td className="px-2 py-2"><input className="w-12 rounded border border-slate-200 px-2 py-1" type="number" value={row.quantity} onChange={(e) => updateOcrRow(index, 'quantity', Number(e.target.value || 0))} /></td>
                        <td className="px-2 py-2"><input className="w-16 rounded border border-slate-200 px-2 py-1" type="number" value={row.mrp} onChange={(e) => updateOcrRow(index, 'mrp', Number(e.target.value || 0))} /></td>
                        <td className="px-2 py-2"><input className="w-16 rounded border border-slate-200 px-2 py-1" type="number" value={row.purchase_rate} onChange={(e) => updateOcrRow(index, 'purchase_rate', Number(e.target.value || 0))} /></td>
                        <td className="px-2 py-2"><input className="w-14 rounded border border-slate-200 px-2 py-1" type="number" value={row.gst_percentage} onChange={(e) => updateOcrRow(index, 'gst_percentage', Number(e.target.value || 0))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={handleOcrConfirm} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Confirm &amp; Add to Inventory</button>
            </div>
          ) : null}
        </div>
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
