import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Printer, UserPlus } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { InvoicePreview } from '../components/common/InvoicePreview';
import { SearchField } from '../components/common/SearchField';
import { useToast } from '../components/common/ToastProvider';
import { createCustomer, formatCurrency, getCustomerHistory, getInvoiceById, getSettings, listCustomers, updateCustomer, updateInvoice } from '../services/pharmaService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { exportInvoicePdf } from '../utils/exporters';
import { resolvePharmacyLogo } from '../utils/logoUtils';

function normalizeInvoiceForPreview(invoice, extra = {}) {
  if (!invoice) return null;

  const items = (invoice.items || []).map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || 0);
    const lineSubtotal = Number((unitPrice * quantity).toFixed(2));
    const gstPercent = Number(item.gst_percent ?? extra.gst_percent ?? invoice.gst_percent ?? 0);
    const gstAmount = Number(((lineSubtotal * gstPercent) / 100).toFixed(2));
    const lineTotal = Number((lineSubtotal + gstAmount).toFixed(2));

    return {
      ...item,
      medicine_name: item.medicine_name || item.inventoryBatch?.medicine?.medicine_name || '—',
      batch_no: item.batch_no || item.inventoryBatch?.batch_no || '—',
      expiry_date: item.expiry_date || item.inventoryBatch?.expiry_date || '—',
      quantity,
      unit_price: unitPrice,
      gst_percent: gstPercent,
      gst_amount: gstAmount,
      line_total: lineTotal,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0);
  const gstAmount = items.reduce((sum, item) => sum + Number(item.gst_amount || 0), 0);

  return {
    ...invoice,
    ...extra,
    items,
    subtotal: Number(subtotal.toFixed(2)),
    gst_amount: Number(gstAmount.toFixed(2)),
    total_amount: Number((subtotal + gstAmount).toFixed(2)),
    customer: extra.customer || invoice.customer || null,
  };
}

function buildInvoicePrintHtml(invoice, settings) {
  const rows = (invoice?.items || []).map((item) => `
    <tr>
      <td>${item.medicine_name || '—'}</td>
      <td>${item.batch_no || '—'}</td>
      <td>${item.expiry_date || '—'}</td>
      <td>${item.quantity || 0}</td>
      <td>${formatCurrency(item.unit_price || 0)}</td>
      <td>${item.gst_percent || 0}%</td>
      <td>${formatCurrency(item.gst_amount || 0)}</td>
      <td>${formatCurrency(item.line_total || 0)}</td>
    </tr>
  `).join('');

  const subtotal = Number(invoice?.subtotal || 0);
  const gstAmount = Number(invoice?.gst_amount || 0);
  const totalAmount = Number(invoice?.total_amount || 0);

  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${invoice?.invoice_no || ''}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
          .card { border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; }
          .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
          .meta { font-size: 13px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f8fafc; }
          .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
          .totals div { width: 300px; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px; }
          .footer { margin-top: 24px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <img src="${resolvePharmacyLogo(settings)}" alt="GenPharma logo" style="height:56px;width:auto;border-radius:16px;" />
              <h2 style="margin:8px 0 4px 0;">${settings?.pharmacy_name || 'GenPharma'}</h2>
              <div class="meta">${[settings?.address_line_1, settings?.address_line_2].filter(Boolean).join(', ')}</div>
              <div class="meta">${[settings?.city, settings?.state, settings?.pin_code].filter(Boolean).join(' - ')}</div>
              <div class="meta">${[settings?.phone_number, settings?.email].filter(Boolean).join(' • ')}</div>
              <div class="meta">GSTIN: ${settings?.gstin || '—'}</div>
            </div>
            <div style="min-width:260px;">
              <h3 style="margin:0 0 6px 0;">Invoice</h3>
              <div class="meta">Invoice No: ${invoice?.invoice_no || ''}</div>
              <div class="meta">Invoice Date: ${invoice?.invoice_date || ''}</div>
              <div class="meta">Payment Method: ${invoice?.payment_method || '—'}</div>
              <div class="meta">Payment Status: ${invoice?.payment_status || '—'}</div>
            </div>
          </div>
          <div style="margin-top:16px;">
            <div class="meta">Bill To: ${invoice?.customer?.customer_name || 'Walk-in Customer'}</div>
            <div class="meta">Phone: ${invoice?.customer?.phone || '—'}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Medicine</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>Unit Price</th><th>GST %</th><th>GST Amt</th><th>Line Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="totals">
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">Subtotal <span>${formatCurrency(subtotal)}</span></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">GST <span>${formatCurrency(gstAmount)}</span></div>
              <div style="display:flex;justify-content:space-between;font-weight:700;">Grand Total <span>${formatCurrency(totalAmount)}</span></div>
            </div>
          </div>
          <div class="footer">
            <p style="margin:0 0 8px 0; font-weight:700;">Thank you for your business.</p>
            <p>${settings?.invoice_footer || 'Thank you for your business.'}</p>
          </div>
        </div>
      </body>
    </html>`;
}

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState(null);
  const [settings, setSettings] = useState(null);
  const [customerForm, setCustomerForm] = useState({ customer_name: '', phone: '', email: '', address: '' });
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    invoice_no: '',
    invoice_date: '',
    payment_method: 'Cash',
    payment_status: 'Paid',
    gst_percent: 0,
    discount_amount: 0,
    notes: '',
    items: [],
  });
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const { showToast } = useToast();

  const loadCustomers = async (term = debouncedSearch) => {
    try {
      setError('');
      setSearching(true);
      const [customerData, settingsData] = await Promise.all([listCustomers(term), getSettings()]);
      setCustomers(customerData || []);
      setSettings(settingsData || null);
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
        await loadCustomers(debouncedSearch);
      }
    };

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

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

  const openInvoicePreview = (invoice) => {
    const normalized = normalizeInvoiceForPreview(invoice, { customer: history?.customer || selectedCustomer || null });
    setPreviewInvoice(normalized);
    setPreviewModalOpen(true);
  };

  const handleInvoiceDownload = (invoice) => {
    const normalized = normalizeInvoiceForPreview(invoice, { customer: history?.customer || selectedCustomer || null });
    exportInvoicePdf(normalized, settings);
  };

  const handleInvoicePrint = (invoice) => {
    const normalized = normalizeInvoiceForPreview(invoice, { customer: history?.customer || selectedCustomer || null });
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) return;
    printWindow.document.write(buildInvoicePrintHtml(normalized, settings));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const stats = useMemo(() => customers.reduce((acc, customer) => ({ ...acc, [customer.customer_id]: customer }), {}), [customers]);

  const openInvoiceEditor = async (invoice) => {
    try {
      const data = await getInvoiceById(invoice.invoice_id);
      const invoiceDetails = data?.invoice || data || null;
      const items = (invoiceDetails?.items || []).map((item) => ({
        medicine_id: item.inventoryBatch?.medicine?.medicine_id || item.medicine_id || '',
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        discount_amount: Number(item.discount_amount || 0),
        medicine_name: item.inventoryBatch?.medicine?.medicine_name || item.medicine_name || '',
      }));

      setEditingInvoice(invoiceDetails);
      setInvoiceForm({
        customer_id: invoiceDetails?.customer_id || '',
        invoice_no: invoiceDetails?.invoice_no || '',
        invoice_date: invoiceDetails?.invoice_date || '',
        payment_method: invoiceDetails?.payment_method || 'Cash',
        payment_status: invoiceDetails?.payment_status || 'Paid',
        gst_percent: Number(invoiceDetails?.gst_amount && invoiceDetails?.total_amount ? ((invoiceDetails.gst_amount / Math.max(1, Number(invoiceDetails.total_amount) - Number(invoiceDetails.discount_amount || 0))) * 100) : 0),
        discount_amount: Number(invoiceDetails?.discount_amount || 0),
        notes: invoiceDetails?.notes || '',
        items,
      });
      setModalOpen(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to load invoice details', 'error');
    }
  };

  const updateInvoiceField = (field, value) => {
    setInvoiceForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateInvoiceItem = (index, field, value) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };

  const addInvoiceItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, { medicine_id: '', quantity: 1, unit_price: 0, discount_amount: 0, medicine_name: '' }],
    }));
  };

  const removeInvoiceItem = (index) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveInvoice = async (event) => {
    event.preventDefault();
    try {
      setInvoiceSaving(true);

      const payload = {
        customer_id: invoiceForm.customer_id || null,
        invoice_no: invoiceForm.invoice_no,
        invoice_date: invoiceForm.invoice_date,
        payment_method: invoiceForm.payment_method,
        payment_status: invoiceForm.payment_status,
        gst_percent: Number(invoiceForm.gst_percent || 0),
        discount_amount: Number(invoiceForm.discount_amount || 0),
        notes: invoiceForm.notes,
        items: invoiceForm.items.map((item) => ({
          medicine_id: Number(item.medicine_id),
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          discount_amount: Number(item.discount_amount || 0),
        })),
      };

      await updateInvoice(editingInvoice.invoice_id, payload);
      const refreshed = await getCustomerHistory(selectedCustomer?.customer_id || history?.customer?.customer_id);
      setHistory(refreshed);
      setEditingInvoice(null);
      setInvoiceForm({
        customer_id: '',
        invoice_no: '',
        invoice_date: '',
        payment_method: 'Cash',
        payment_status: 'Paid',
        gst_percent: 0,
        discount_amount: 0,
        notes: '',
        items: [],
      });
      showToast('Invoice updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to update invoice', 'error');
    } finally {
      setInvoiceSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
          <p className="text-sm text-slate-500">Search customers and review complete invoice history for every bill.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <div className="min-w-[260px]">
              <SearchField value={search} onChange={setSearch} placeholder="Search phone or name" loading={searching} />
            </div>
          </div>
          <button type="button" onClick={() => openCustomerModal()} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            <UserPlus size={16} /> Add Customer
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <span>Loading customers…</span>
        </div>
      ) : null}
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

      <Modal
        open={modalOpen}
        title={history ? (history.customer?.customer_name || selectedCustomer?.customer_name) : (selectedCustomer ? 'Edit Customer' : 'Add Customer')}
        description={history ? `Purchase summary • ${history.stats?.totalPurchases || 0} bills • ${formatCurrency(history.stats?.totalSpent)}` : (selectedCustomer ? 'Update the customer record used by billing.' : 'Create a customer record for future billing.')}
        onClose={() => setModalOpen(false)}
        panelClassName="w-full max-w-[1000px]"
        bodyClassName="px-0 py-0"
      >
        {!history ? (
          <div className="px-5 py-4 sm:px-6">
            <form onSubmit={saveCustomer} className="space-y-3">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Customer name" value={customerForm.customer_name} onChange={(e) => setCustomerForm({ ...customerForm, customer_name: e.target.value })} required />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} required />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Address" value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} />
              <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Save Customer</button>
            </form>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{history.customer?.customer_name || selectedCustomer?.customer_name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{history.stats?.totalPurchases || 0} bills • {formatCurrency(history.stats?.totalSpent)}</p>
                </div>
                <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">Invoice History</div>
              </div>
            </div>
            <div className="flex-1 px-5 py-4 sm:px-6">
              {editingInvoice ? (
                <form onSubmit={saveInvoice} className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Invoice No</span>
                        <input className="w-full bg-transparent outline-none" value={invoiceForm.invoice_no} onChange={(e) => updateInvoiceField('invoice_no', e.target.value)} required />
                      </label>
                      <label className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Invoice Date</span>
                        <input className="w-full bg-transparent outline-none" type="date" value={invoiceForm.invoice_date} onChange={(e) => updateInvoiceField('invoice_date', e.target.value)} />
                      </label>
                      <label className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Payment Method</span>
                        <select className="w-full bg-transparent outline-none" value={invoiceForm.payment_method} onChange={(e) => updateInvoiceField('payment_method', e.target.value)}>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="UPI">UPI</option>
                        </select>
                      </label>
                      <label className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Payment Status</span>
                        <select className="w-full bg-transparent outline-none" value={invoiceForm.payment_status} onChange={(e) => updateInvoiceField('payment_status', e.target.value)}>
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </label>
                      <label className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">GST %</span>
                        <input className="w-full bg-transparent outline-none" type="number" min="0" step="0.01" value={invoiceForm.gst_percent} onChange={(e) => updateInvoiceField('gst_percent', e.target.value)} />
                      </label>
                      <label className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Discount</span>
                        <input className="w-full bg-transparent outline-none" type="number" min="0" step="0.01" value={invoiceForm.discount_amount} onChange={(e) => updateInvoiceField('discount_amount', e.target.value)} />
                      </label>
                    </div>
                    <label className="mt-3 block rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                      <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Notes</span>
                      <textarea className="w-full bg-transparent outline-none" rows="3" value={invoiceForm.notes} onChange={(e) => updateInvoiceField('notes', e.target.value)} />
                    </label>
                  </div>

                  <div className="space-y-3">
                    {invoiceForm.items.map((item, index) => (
                      <div key={`${item.medicine_id || index}-${index}`} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-3">
                          <label className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                            <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Medicine ID</span>
                            <input className="w-full bg-transparent outline-none" value={item.medicine_id} onChange={(e) => updateInvoiceItem(index, 'medicine_id', e.target.value)} />
                          </label>
                          <label className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                            <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Quantity</span>
                            <input className="w-full bg-transparent outline-none" type="number" min="1" value={item.quantity} onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)} />
                          </label>
                          <label className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                            <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Unit Price</span>
                            <input className="w-full bg-transparent outline-none" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateInvoiceItem(index, 'unit_price', e.target.value)} />
                          </label>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm text-slate-500">Medicine name: {item.medicine_name || '—'}</div>
                          <button type="button" onClick={() => removeInvoiceItem(index)} className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={addInvoiceItem} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Add item</button>
                    <button type="submit" disabled={invoiceSaving} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">{invoiceSaving ? 'Saving...' : 'Save Invoice'}</button>
                    <button type="button" onClick={() => { setEditingInvoice(null); setInvoiceForm({ customer_id: '', invoice_no: '', invoice_date: '', payment_method: 'Cash', payment_status: 'Paid', gst_percent: 0, discount_amount: 0, notes: '', items: [] }); }} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                  </div>
                </form>
              ) : history.invoices?.length ? (
                <div className="space-y-3">
                  {history.invoices.map((invoice) => (
                    <div key={invoice.invoice_id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{invoice.invoice_no}</div>
                          <div className="mt-1 text-sm text-slate-500">{invoice.invoice_date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold text-slate-900">{formatCurrency(invoice.total_amount)}</div>
                          <div className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{invoice.payment_status || 'Pending'}</div>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Payment Status</p>
                          <p className="mt-1 font-medium text-slate-700">{invoice.payment_status || '—'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Payment Method</p>
                          <p className="mt-1 font-medium text-slate-700">{invoice.payment_method || '—'}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => openInvoicePreview(invoice)} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                          <Eye size={14} /> View Bill
                        </button>
                        <button type="button" onClick={() => handleInvoiceDownload(invoice)} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                          <Download size={14} /> Download PDF
                        </button>
                        <button type="button" onClick={() => handleInvoicePrint(invoice)} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                          <Printer size={14} /> Print
                        </button>
                        <button type="button" onClick={() => openInvoiceEditor(invoice)} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                          Edit Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="No purchase history" description="This customer has no invoice history in the backend yet." />}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={previewModalOpen} title="Invoice Preview" description="Professional invoice preview generated from the latest backend invoice data." onClose={() => setPreviewModalOpen(false)} panelClassName="max-w-6xl">
        {previewInvoice ? <InvoicePreview invoice={previewInvoice} settings={settings} onPrint={() => {
          const printWindow = window.open('', '_blank', 'width=900,height=900');
          if (!printWindow) return;
          printWindow.document.write(buildInvoicePrintHtml(previewInvoice, settings));
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 250);
        }} onDownload={() => exportInvoicePdf(previewInvoice, settings)} onBack={() => setPreviewModalOpen(false)} onNewBill={() => setPreviewModalOpen(false)} /> : null}
      </Modal>
    </div>
  );
}
