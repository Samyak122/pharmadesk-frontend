import { useEffect, useMemo, useState } from 'react';
import { Search, PackagePlus } from 'lucide-react';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/ToastProvider';
import { createInventory, createMedicine, deleteInventory, listInventory, updateInventory } from '../services/pharmaService';

export function InventoryPage({ defaultFilter = 'all' }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(() => {
    if (defaultFilter === 'stock') return { search: '', lowStock: true, expired: false };
    if (defaultFilter === 'expiry') return { search: '', lowStock: false, expired: false };
    return { search: '', lowStock: false, expired: false };
  });
  const [activeBatch, setActiveBatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [adjustment, setAdjustment] = useState('');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ medicine_name: '', manufacturer: '', composition: '', category: '', hsn_code: '', gst_percent: '', purchase_price: '', selling_price: '', batch_no: '', expiry_date: '', quantity: 10, min_stock: 5, location: '', barcode: '' });
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadInventory = async () => {
    try {
      let data = [];
      if (defaultFilter === 'stock') {
        data = await listInventory({ search: filters.search, lowStock: true, expired: false });
      } else if (defaultFilter === 'expiry') {
        const [soonData, expiredData] = await Promise.all([
          listInventory({ search: filters.search, expiringSoon: 30 }),
          listInventory({ search: filters.search, expired: true }),
        ]);
        const seen = new Set();
        data = [...(soonData || []), ...(expiredData || [])].filter((batch) => {
          const key = `${batch.stock_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      } else {
        data = await listInventory({ search: filters.search, lowStock: filters.lowStock, expired: filters.expired });
      }
      setBatches(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadInventory();
  }, [filters.search, filters.lowStock, filters.expired, defaultFilter]);

  const openAdjustModal = (batch) => {
    setActiveBatch(batch);
    setAdjustment('');
    setModalOpen(true);
  };

  const adjustQuantity = async (event) => {
    event.preventDefault();
    try {
      const nextQuantity = Number(adjustment);
      await updateInventory(activeBatch.stock_id, { quantity: nextQuantity });
      window.dispatchEvent(new Event('pharmadesk:refresh-dashboard'));
      await loadInventory();
      setModalOpen(false);
      showToast('Stock updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to update inventory', 'error');
    }
  };

  const removeBatch = async (batch) => {
    try {
      await deleteInventory(batch.stock_id);
      window.dispatchEvent(new Event('pharmadesk:refresh-dashboard'));
      await loadInventory();
      showToast('Batch removed', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to delete batch', 'error');
    }
  };

  const submitCustomProduct = async (event) => {
    event.preventDefault();
    try {
      setCustomSubmitting(true);
      const createdMedicine = await createMedicine({
        medicine_name: customForm.medicine_name,
        manufacturer: customForm.manufacturer,
        composition: customForm.composition,
        category: customForm.category,
        hsn_code: customForm.hsn_code,
        gst_percent: Number(customForm.gst_percent || 0),
        barcode: customForm.barcode,
      });

      await createInventory({
        medicine_id: createdMedicine.medicine_id,
        batch_no: customForm.batch_no,
        expiry_date: customForm.expiry_date,
        quantity: Number(customForm.quantity || 0),
        unit_cost: Number(customForm.purchase_price || 0),
        selling_price: Number(customForm.selling_price || 0),
        min_stock: Number(customForm.min_stock || 5),
        location: customForm.location,
      });

      setCustomModalOpen(false);
      setCustomForm({ medicine_name: '', manufacturer: '', composition: '', category: '', hsn_code: '', gst_percent: '', purchase_price: '', selling_price: '', batch_no: '', expiry_date: '', quantity: 10, min_stock: 5, location: '', barcode: '' });
      await loadInventory();
      showToast('Custom product created and added to inventory', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to create custom product', 'error');
    } finally {
      setCustomSubmitting(false);
    }
  };

  const summary = useMemo(() => ({
    lowStock: batches.filter((batch) => Number(batch.quantity || 0) <= Number(batch.min_stock || 5)).length,
    expired: batches.filter((batch) => batch.isExpired).length,
  }), [batches]);

  if (loading) return <Loader label="Loading inventory" />;

  return (
    <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Inventory Management</h2>
          <p className="text-sm text-slate-500">Batch-level stock control and expiry awareness are sourced from the backend.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="rounded-2xl border border-slate-200 px-10 py-3 text-sm" placeholder="Search medicine" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <button type="button" onClick={() => setCustomModalOpen(true)} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            <PackagePlus size={16} /> Add Custom Product
          </button>
          {!defaultFilter ? (
            <>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                <input type="checkbox" checked={filters.lowStock} onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })} />
                Low Stock
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                <input type="checkbox" checked={filters.expired} onChange={(e) => setFilters({ ...filters, expired: e.target.checked })} />
                Expired
              </label>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Low stock batches: {summary.lowStock}</div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Expired batches: {summary.expired}</div>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {batches.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Selling</th>
                <th className="px-4 py-3">Rack</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.stock_id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{batch.medicine?.medicine_name || 'Unknown'}</td>
                  <td className="px-4 py-3">{batch.batch_no}</td>
                  <td className="px-4 py-3">{batch.expiry_date}</td>
                  <td className="px-4 py-3">{batch.quantity}</td>
                  <td className="px-4 py-3">₹{Number(batch.selling_price || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">{batch.location || '—'}</td>
                  <td className="px-4 py-3">
                    {batch.isExpired ? <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">Expired</span> : batch.isLowStock ? <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Low Stock</span> : <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Healthy</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openAdjustModal(batch)} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Adjust</button>
                      <button type="button" onClick={() => removeBatch(batch)} className="rounded-full border border-rose-200 px-3 py-1 text-sm text-rose-700">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No Inventory" description="No inventory batches matched the current filters." />
      )}

      <Modal open={modalOpen} title="Adjust quantity" description="Update the batch quantity directly through the backend inventory endpoint." onClose={() => setModalOpen(false)}>
        <form onSubmit={adjustQuantity} className="space-y-3">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="New quantity" value={adjustment} onChange={(e) => setAdjustment(e.target.value)} required />
          <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Save Quantity</button>
        </form>
      </Modal>

      <Modal open={customModalOpen} title="Add Custom Product" description="Create a new product and immediately add it to inventory." onClose={() => setCustomModalOpen(false)}>
        <form onSubmit={submitCustomProduct} className="grid gap-3 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" placeholder="Product Name" value={customForm.medicine_name} onChange={(e) => setCustomForm({ ...customForm, medicine_name: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Manufacturer" value={customForm.manufacturer} onChange={(e) => setCustomForm({ ...customForm, manufacturer: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Category" value={customForm.category} onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Composition (optional)" value={customForm.composition} onChange={(e) => setCustomForm({ ...customForm, composition: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="HSN Code (optional)" value={customForm.hsn_code} onChange={(e) => setCustomForm({ ...customForm, hsn_code: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="GST %" value={customForm.gst_percent} onChange={(e) => setCustomForm({ ...customForm, gst_percent: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Purchase Price" value={customForm.purchase_price} onChange={(e) => setCustomForm({ ...customForm, purchase_price: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Selling Price" value={customForm.selling_price} onChange={(e) => setCustomForm({ ...customForm, selling_price: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Batch Number" value={customForm.batch_no} onChange={(e) => setCustomForm({ ...customForm, batch_no: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="date" value={customForm.expiry_date} onChange={(e) => setCustomForm({ ...customForm, expiry_date: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Quantity" value={customForm.quantity} onChange={(e) => setCustomForm({ ...customForm, quantity: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Minimum Stock" value={customForm.min_stock} onChange={(e) => setCustomForm({ ...customForm, min_stock: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" placeholder="Rack Location" value={customForm.location} onChange={(e) => setCustomForm({ ...customForm, location: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" placeholder="Barcode (optional)" value={customForm.barcode} onChange={(e) => setCustomForm({ ...customForm, barcode: e.target.value })} />
          <button disabled={customSubmitting} type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white md:col-span-2 disabled:opacity-70">{customSubmitting ? 'Saving...' : 'Save Product'}</button>
        </form>
      </Modal>
    </div>
  );
}
