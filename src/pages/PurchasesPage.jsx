import { useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { SearchField } from '../components/common/SearchField';
import { useToast } from '../components/common/ToastProvider';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { createPurchase, getSuppliers, listPurchases, searchMedicines } from '../services/pharmaService';
import { formatCurrency } from '../services/pharmaService';

export function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [modalOpen, setModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [medicineResults, setMedicineResults] = useState([]);
  const [form, setForm] = useState({ supplier_id: '', invoice_no: '', notes: '', payment_status: 'Pending', medicine_id: '', batch_no: '', expiry_date: '', quantity: 1, unit_cost: '', selling_price: '', min_stock: 5, location: '' });
  const [submitting, setSubmitting] = useState(false);
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

  return (
    <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Purchases</h2>
          <p className="text-sm text-slate-500">Create new purchase orders and let the backend update inventory automatically.</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
          <PlusCircle size={16} /> New Purchase
        </button>
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
