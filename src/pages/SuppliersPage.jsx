import { useEffect, useState } from 'react';
import { Building2, PlusCircle } from 'lucide-react';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastProvider';
import { getSuppliers } from '../services/pharmaService';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  if (loading) return <Loader label="Loading suppliers" />;

  return (
    <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Suppliers</h2>
          <p className="text-sm text-slate-500">Supplier records are displayed from the backend report service.</p>
        </div>
        <button type="button" onClick={handleAddSupplier} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
          <PlusCircle size={16} /> Add Supplier
        </button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {suppliers.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
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
