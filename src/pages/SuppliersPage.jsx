import { useEffect, useMemo, useState } from 'react';
import { Building2, PlusCircle } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SearchField } from '../components/common/SearchField';
import { useToast } from '../components/common/ToastProvider';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getSuppliers } from '../services/pharmaService';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { showToast } = useToast();

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data || []);
      } catch (err) {
        setError('Cannot connect to server.');
      } finally {
        setLoading(false);
      }
    };
    loadSuppliers();
  }, []);

  const handleAddSupplier = () => {
    showToast('Supplier creation is not exposed by the current backend API.', 'error');
  };

  const filteredSuppliers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return suppliers;

    return suppliers.filter((supplier) => {
      const haystack = [supplier.supplier_name, supplier.phone, supplier.email, supplier.gst_number, supplier.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [debouncedSearch, suppliers]);

  return (
    <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Suppliers</h2>
          <p className="text-sm text-slate-500">Supplier records are displayed from the backend report service.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px]">
            <SearchField value={search} onChange={setSearch} placeholder="Search suppliers" />
          </div>
          <button type="button" onClick={handleAddSupplier} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            <PlusCircle size={16} /> Add Supplier
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <span>Loading suppliers…</span>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {filteredSuppliers.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.supplier_id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900 p-2 text-white">
                  <Building2 size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{supplier.supplier_name}</h3>
                  <p className="text-sm text-slate-500">{supplier.phone || '—'}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">Email: {supplier.email || '—'}</p>
              <p className="mt-1 text-sm text-slate-500">GST: {supplier.gst_number || '—'}</p>
              <p className="mt-1 text-sm text-slate-500">Address: {supplier.address || '—'}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No Suppliers" description="No supplier records are available from the backend." />
      )}
    </div>
  );
}
