import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, PackagePlus } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { SearchField } from '../components/common/SearchField';
import { useToast } from '../components/common/ToastProvider';
import { createInventory, createMedicine, searchMedicines } from '../services/pharmaService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ batch_no: '', expiry_date: '', quantity: 10, unit_cost: '', selling_price: '', min_stock: 5, location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ medicine_name: '', manufacturer: '', composition: '', category: '', hsn_code: '', gst_percent: '', purchase_price: '', selling_price: '', batch_no: '', expiry_date: '', quantity: 10, min_stock: 5, location: '', barcode: '' });
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadMedicines = async (keyword = debouncedSearch || 'a') => {
    try {
      setError('');
      setSearching(true);
      const results = await searchMedicines(keyword || 'a');
      setMedicines(results || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to server.');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      setLoading(true);
      if (!cancelled) {
        await loadMedicines(debouncedSearch || 'a');
      }
    };

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const openModal = (medicine) => {
    setSelectedMedicine(medicine);
    setModalOpen(true);
  };

  const submitInventory = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await createInventory({
        medicine_id: selectedMedicine.medicine_id,
        batch_no: form.batch_no,
        expiry_date: form.expiry_date,
        quantity: Number(form.quantity),
        unit_cost: Number(form.unit_cost || 0),
        selling_price: Number(form.selling_price || 0),
        min_stock: Number(form.min_stock || 5),
        location: form.location,
      });
      setModalOpen(false);
      setForm({ batch_no: '', expiry_date: '', quantity: 10, unit_cost: '', selling_price: '', min_stock: 5, location: '' });
      await loadMedicines(search);
      showToast('Inventory batch added', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to add inventory', 'error');
    } finally {
      setSubmitting(false);
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
      setSearch(createdMedicine.medicine_name);
      await loadMedicines(createdMedicine.medicine_name);
      showToast('Custom product created and added to inventory', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to create custom product', 'error');
    } finally {
      setCustomSubmitting(false);
    }
  };

  const items = useMemo(() => medicines.slice(0, 24), [medicines]);

  return (
    <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Medicine Catalog</h2>
          <p className="text-sm text-slate-500">Search the medicine master and add batches to inventory through the backend API.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px]">
            <SearchField value={search} onChange={setSearch} placeholder="Search medicines" loading={searching} />
          </div>
          <button type="button" onClick={() => setCustomModalOpen(true)} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            <PackagePlus size={16} /> Add Custom Product
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <span>Loading catalog…</span>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((medicine) => (
            <div key={medicine.medicine_id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{medicine.medicine_name}</h3>
              <p className="mt-2 text-sm text-slate-500">Manufacturer: {medicine.manufacturer || '—'}</p>
              <p className="mt-2 text-sm text-slate-500">Composition: {medicine.composition || '—'}</p>
              <button type="button" onClick={() => openModal(medicine)} className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                <PlusCircle size={16} /> Add To Inventory
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No Medicines" description="No medicines matched the current search." />
      )}

      <Modal open={modalOpen} title={`Add ${selectedMedicine?.medicine_name || 'Medicine'} to Inventory`} description="Create a stock batch through the backend inventory endpoint." onClose={() => setModalOpen(false)}>
        <form onSubmit={submitInventory} className="grid gap-3 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Batch Number" value={form.batch_no} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Purchase Price" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Selling Price" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min="0" placeholder="Minimum Stock" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" placeholder="Rack Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <button disabled={submitting} type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white md:col-span-2 disabled:opacity-70">{submitting ? 'Saving...' : 'Save Batch'}</button>
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
