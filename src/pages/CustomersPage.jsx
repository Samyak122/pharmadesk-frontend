import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/ToastProvider';
import { createCustomer, getCustomerHistory, listCustomers, updateCustomer } from '../services/pharmaService';
import { formatCurrency } from '../services/pharmaService';

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState(null);
  const [customerForm, setCustomerForm] = useState({ customer_name: '', phone: '', email: '', address: '' });
  const { showToast } = useToast();

  const loadCustomers = async () => {
    try {
      const data = await listCustomers(search);
      setCustomers(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadCustomers();
  }, [search]);

  const openCustomerModal = (customer = null) => {
    setSelectedCustomer(customer);
    setCustomerForm(customer ? { customer_name: customer.customer_name || '', phone: customer.phone || '', email: customer.email || '', address: customer.address || '' } : { customer_name: '', phone: '', email: '', address: '' });
    setModalOpen(true);
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.customer_id, customerForm);
      } else {
        await createCustomer(customerForm);
      }
      await loadCustomers();
      setModalOpen(false);
      showToast(selectedCustomer ? 'Customer updated' : 'Customer created', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to save customer', 'error');
    }
  };

  const inspectHistory = async (customer) => {
    try {
      const data = await getCustomerHistory(customer.customer_id);
      setHistory(data);
      setSelectedCustomer(customer);
      setModalOpen(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to load customer history', 'error');
    }
  };

  const stats = useMemo(() => customers.reduce((acc, customer) => ({ ...acc, [customer.customer_id]: customer }), {}), [customers]);

  if (loading) return <Loader label="Loading customers" />;

  return (
    <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
          <p className="text-sm text-slate-500">Search customers and review purchase history from the backend.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="rounded-2xl border border-slate-200 px-10 py-3 text-sm" placeholder="Search phone or name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="button" onClick={() => openCustomerModal()} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            <UserPlus size={16} /> Add Customer
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {customers.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <div key={customer.customer_id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{customer.customer_name}</h3>
                  <p className="mt-2 text-sm text-slate-500">Phone: {customer.phone}</p>
                  <p className="text-sm text-slate-500">Email: {customer.email || '—'}</p>
                </div>
                <button type="button" onClick={() => inspectHistory(customer)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">History</button>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">Address: {customer.address || '—'}</div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No Customers" description="No customers are currently available from the backend." />
      )}

      <Modal open={modalOpen} title={selectedCustomer ? 'Edit Customer' : 'Add Customer'} description={selectedCustomer ? 'Update the customer record used by billing.' : 'Create a customer record for future billing.'} onClose={() => setModalOpen(false)}>
        {!history ? (
          <form onSubmit={saveCustomer} className="space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Customer name" value={customerForm.customer_name} onChange={(e) => setCustomerForm({ ...customerForm, customer_name: e.target.value })} required />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} required />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Address" value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Save Customer</button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{history.customer?.customer_name || selectedCustomer?.customer_name}</h3>
              <p className="mt-1 text-sm text-slate-500">Total purchases: {history.stats?.totalPurchases || 0}</p>
              <p className="mt-1 text-sm text-slate-500">Total spent: {formatCurrency(history.stats?.totalSpent)}</p>
            </div>
            {history.invoices?.length ? (
              <div className="space-y-2">
                {history.invoices.map((invoice) => (
                  <div key={invoice.invoice_id} className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{invoice.invoice_no}</span>
                      <span>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    <p className="mt-1">{invoice.invoice_date}</p>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No purchase history" description="This customer has no invoice history in the backend yet." />}
          </div>
        )}
      </Modal>
    </div>
  );
}
