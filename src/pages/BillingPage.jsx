import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ReceiptText, UserPlus, PlusCircle, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { InvoicePreview } from '../components/common/InvoicePreview';
import { SearchField } from '../components/common/SearchField';
import { useToast } from '../components/common/ToastProvider';
import { createCustomer, createInvoice, getSettings, listCustomers, listInvoices, listInventory, searchCustomersByPhone, searchMedicines } from '../services/pharmaService';
import { formatCurrency } from '../services/pharmaService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { exportInvoicePdf } from '../utils/exporters';
import { calculateInvoiceTotals } from '../utils/billingUtils';

export function BillingPage() {
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearching, setCustomerSearching] = useState(false);
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 300);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ customer_name: '', phone: '', email: '', address: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [medicineSearching, setMedicineSearching] = useState(false);
  const debouncedMedicineSearch = useDebouncedValue(searchTerm, 300);
  const [medicineResults, setMedicineResults] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [gstPercent, setGstPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { showToast } = useToast();

  const normalizeInvoiceForPreview = (invoice, extra = {}) => {
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
  };

  const loadData = async () => {
    try {
      const [customerData, invoiceData, settingsData] = await Promise.all([listCustomers(), listInvoices(), getSettings()]);
      setCustomers(customerData || []);
      setInvoices(invoiceData || []);
      setSettings(settingsData || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to server.');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [location.key]);

  const searchMedicineCatalog = (value) => {
    setSearchTerm(value);
    if (!value) {
      setMedicineResults([]);
      return;
    }
  };

  useEffect(() => {
    if (!debouncedMedicineSearch) {
      setMedicineResults([]);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      try {
        setMedicineSearching(true);
        const results = await searchMedicines(debouncedMedicineSearch);
        if (!cancelled) {
          setMedicineResults(results || []);
        }
      } catch {
        if (!cancelled) {
          setMedicineResults([]);
        }
      } finally {
        if (!cancelled) {
          setMedicineSearching(false);
        }
      }
    };

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedMedicineSearch]);

  const selectMedicine = async (medicineId) => {
    const medicine = medicineResults.find((item) => String(item.medicine_id) === String(medicineId)) || null;
    setSelectedMedicineId(String(medicineId));
    setSearchTerm(medicine?.medicine_name || '');
    setSelectedMedicine(medicine);
    setSelectedBatch(null);
    setAvailableBatches([]);

    if (!medicineId) return;

    try {
      const batches = await listInventory({ medicine_id: Number(medicineId) });
      const activeBatches = (batches || []).filter((batch) => Number(batch.quantity || 0) > 0);
      setAvailableBatches(activeBatches);
      setSelectedBatch(activeBatches[0] || null);
    } catch {
      setAvailableBatches([]);
      setSelectedBatch(null);
    }
  };

  const findCustomer = (phone) => {
    setCustomerSearch(phone);
    if (!phone) {
      setSelectedCustomer(null);
      return;
    }
  };

  useEffect(() => {
    if (!debouncedCustomerSearch) {
      setSelectedCustomer(null);
      return;
    }

    let cancelled = false;

    const runLookup = async () => {
      try {
        setCustomerSearching(true);
        const results = await searchCustomersByPhone(debouncedCustomerSearch);
        if (!cancelled) {
          setSelectedCustomer(results.length ? results[0] : null);
        }
      } catch {
        if (!cancelled) {
          setSelectedCustomer(null);
        }
      } finally {
        if (!cancelled) {
          setCustomerSearching(false);
        }
      }
    };

    runLookup();

    return () => {
      cancelled = true;
    };
  }, [debouncedCustomerSearch]);

  const selectBatch = (batchId) => {
    const batch = availableBatches.find((item) => String(item.stock_id) === String(batchId)) || null;
    setSelectedBatch(batch);
  };

  const addToCart = () => {
    if (!selectedMedicine || !selectedBatch) {
      showToast('Select a medicine and available batch first.', 'error');
      return;
    }

    const nextQty = Number(quantity || 0);
    const availableQty = Number(selectedBatch.quantity || 0);

    if (!Number.isFinite(nextQty) || nextQty <= 0) {
      showToast('Enter a valid quantity.', 'error');
      return;
    }

    if (nextQty > availableQty) {
      showToast(`Only ${availableQty} units available in the selected batch.`, 'error');
      return;
    }

    const lineItem = {
      medicine_id: Number(selectedMedicine.medicine_id),
      medicine_name: selectedMedicine.medicine_name,
      stock_id: selectedBatch.stock_id,
      batch_no: selectedBatch.batch_no,
      expiry_date: selectedBatch.expiry_date,
      quantity: nextQty,
      unit_price: Number(selectedBatch.selling_price || 0),
      gst_percent: Number(gstPercent || 0),
      available_quantity: availableQty,
    };

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => String(item.stock_id) === String(lineItem.stock_id));
      if (existingIndex >= 0) {
        return prev.map((item, index) => (index === existingIndex ? { ...item, quantity: item.quantity + lineItem.quantity } : item));
      }
      return [...prev, lineItem];
    });

    setQuantity(1);
    showToast('Medicine added to bill', 'success');
  };

  const updateCartItem = (index, nextQty) => {
    const normalized = Number(nextQty || 0);
    if (normalized <= 0) {
      setCart((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
      return;
    }

    setCart((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, quantity: normalized } : item)));
  };

  const removeCartItem = (index) => {
    setCart((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totals = useMemo(() => calculateInvoiceTotals(cart, Number(gstPercent || 0), Number(discountAmount || 0)), [cart, gstPercent, discountAmount]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      showToast('Add at least one medicine to the bill.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customer_id: selectedCustomer?.customer_id || null,
        invoice_no: invoiceNumber || `INV-${Date.now()}`,
        invoice_date: invoiceDate,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        gst_percent: Number(gstPercent || 0),
        discount_amount: Number(discountAmount || 0),
        items: cart.map((item) => ({
          medicine_id: Number(item.medicine_id),
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          discount_amount: Number(discountAmount || 0),
        })),
      };

      const response = await createInvoice(payload);
      const createdInvoice = response?.data?.invoice || response?.invoice || response?.data || null;
      const previewItems = (cart || []).map((item) => ({
        ...item,
        unit_price: Number(item.unit_price || 0),
        quantity: Number(item.quantity || 0),
        gst_percent: Number(gstPercent || 0),
        gst_amount: Number((((Number(item.unit_price || 0) * Number(item.quantity || 0)) * Number(gstPercent || 0)) / 100).toFixed(2)),
      }));
      const previewSubtotal = previewItems.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0);
      const previewGstAmount = previewItems.reduce((sum, item) => sum + Number(item.gst_amount || 0), 0);
      const invoiceWithItems = normalizeInvoiceForPreview({
        ...(createdInvoice || {}),
        invoice_no: createdInvoice?.invoice_no || payload.invoice_no,
        invoice_date: createdInvoice?.invoice_date || payload.invoice_date,
        payment_method: payload.payment_method,
        payment_status: payload.payment_status,
        discount_amount: Number(payload.discount_amount || 0),
        gst_percent: Number(payload.gst_percent || 0),
        total_amount: Number((previewSubtotal + previewGstAmount).toFixed(2)),
        items: previewItems,
      }, {
        customer: selectedCustomer || null,
        gst_percent: Number(payload.gst_percent || 0),
        payment_method: payload.payment_method,
        payment_status: payload.payment_status,
      });

      await loadData();
      window.dispatchEvent(new Event('pharmadesk:refresh-dashboard'));
      setCart([]);
      setSelectedMedicine(null);
      setSelectedMedicineId('');
      setSearchTerm('');
      setMedicineResults([]);
      setAvailableBatches([]);
      setSelectedBatch(null);
      setQuantity(1);
      setInvoiceNumber('');
      setInvoiceDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('Cash');
      setPaymentStatus('Paid');
      setGstPercent(0);
      setDiscountAmount(0);
      setCustomerSearch('');
      setSelectedCustomer(null);
      setPreviewInvoice(invoiceWithItems);
      setPreviewVisible(true);
      showToast('Invoice created successfully', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create invoice.');
      showToast(err.response?.data?.message || 'Unable to create invoice.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addCustomer = async (event) => {
    event.preventDefault();
    try {
      const result = await createCustomer({ ...customerForm, phone: customerForm.phone.trim() });
      const created = result?.data || result;
      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomer(created);
      setCustomerModalOpen(false);
      setCustomerForm({ customer_name: '', phone: '', email: '', address: '' });
      showToast('Customer added and selected', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to add customer', 'error');
    }
  };

  const recentInvoices = useMemo(() => invoices.slice(0, 8), [invoices]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (previewInvoice) {
      exportInvoicePdf(previewInvoice, settings);
    }
  };

  if (previewVisible && previewInvoice) {
    return (
      <InvoicePreview
        invoice={previewInvoice}
        settings={settings}
        onPrint={handlePrint}
        onDownload={handleDownload}
        onBack={() => setPreviewVisible(false)}
        onNewBill={() => {
          setPreviewVisible(false);
          setPreviewInvoice(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Point of Sale</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Professional pharmacy billing</h2>
            <p className="mt-1 text-sm text-slate-500">Search a customer, pick medicines, and build a full cart before generating a single invoice.</p>
          </div>
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{recentInvoices.length} recent bills</div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Customer</h3>
                <button type="button" onClick={() => setCustomerModalOpen(true)} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                  <UserPlus size={16} /> Add Customer
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <div className="w-full">
                  <SearchField value={customerSearch} onChange={findCustomer} placeholder="Search by phone" loading={customerSearching} />
                </div>
                <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={selectedCustomer?.customer_id || ''} onChange={(e) => {
                  const customer = customers.find((item) => String(item.customer_id) === String(e.target.value));
                  setSelectedCustomer(customer || null);
                }}>
                  <option value="">Walk-in customer</option>
                  {customers.map((customer) => (
                    <option key={customer.customer_id} value={customer.customer_id}>{customer.customer_name} • {customer.phone}</option>
                  ))}
                </select>
                {selectedCustomer ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Selected customer: {selectedCustomer.customer_name}</div> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Medicine</h3>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">Inventory-backed</div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="w-full">
                  <SearchField value={searchTerm} onChange={searchMedicineCatalog} placeholder="Search medicine" loading={medicineSearching} />
                </div>
                {medicineResults.length ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-2">
                    {medicineResults.map((medicine) => (
                      <button key={medicine.medicine_id} type="button" onClick={() => selectMedicine(medicine.medicine_id)} className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm ${selectedMedicineId === String(medicine.medicine_id) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                        <span>{medicine.medicine_name}</span>
                        <span>{medicine.manufacturer || '—'}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {selectedMedicine ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{selectedMedicine.medicine_name}</p>
                    {availableBatches.length ? (
                      <label className="mt-3 block rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Batch</span>
                        <select className="w-full bg-transparent outline-none" value={selectedBatch?.stock_id || ''} onChange={(event) => selectBatch(event.target.value)}>
                          {availableBatches.map((batch) => (
                            <option key={batch.stock_id} value={batch.stock_id}>{batch.batch_no} • {batch.expiry_date}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div><span className="text-slate-400">Batch</span><p className="font-medium text-slate-700">{selectedBatch?.batch_no || '—'}</p></div>
                      <div><span className="text-slate-400">Expiry</span><p className="font-medium text-slate-700">{selectedBatch?.expiry_date || '—'}</p></div>
                      <div><span className="text-slate-400">Available</span><p className="font-medium text-slate-700">{selectedBatch ? `${selectedBatch.quantity}` : '—'}</p></div>
                      <div><span className="text-slate-400">Selling Price</span><p className="font-medium text-slate-700">{selectedBatch ? formatCurrency(selectedBatch.selling_price) : '—'}</p></div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Quantity</span>
                    <input className="w-full bg-transparent outline-none" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </label>
                  <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Unit Price</span>
                    <input className="w-full bg-transparent outline-none" type="number" step="0.01" min="0" value={selectedBatch?.selling_price || ''} readOnly />
                  </label>
                </div>
                <button type="button" onClick={addToCart} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  <PlusCircle size={16} /> Add to Bill
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Invoice No</span>
                  <input className="w-full bg-transparent outline-none" placeholder="INV-001" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                </label>
                <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Date</span>
                  <input className="w-full bg-transparent outline-none" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </label>
                <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Payment</span>
                  <select className="w-full bg-transparent outline-none" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Status</span>
                  <select className="w-full bg-transparent outline-none" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </label>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">GST %</span>
                  <input className="w-full bg-transparent outline-none" type="number" min="0" step="0.01" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} />
                </label>
                <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Discount</span>
                  <input className="w-full bg-transparent outline-none" type="number" min="0" step="0.01" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Bill Cart</h3>
                <p className="text-sm text-slate-500">All medicines are collected before checkout</p>
              </div>
              <button type="button" onClick={clearCart} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">Clear Cart</button>
            </div>

            {cart.length ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-3">Medicine</th>
                      <th className="px-3 py-3">Batch</th>
                      <th className="px-3 py-3">Qty</th>
                      <th className="px-3 py-3">Price</th>
                      <th className="px-3 py-3">Total</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => (
                      <tr key={`${item.medicine_id}-${item.stock_id}-${index}`} className="border-t border-slate-200">
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">{item.medicine_name}</p>
                          <p className="text-xs text-slate-500">{item.expiry_date}</p>
                        </td>
                        <td className="px-3 py-3">{item.batch_no}</td>
                        <td className="px-3 py-3">
                          <input className="w-16 rounded-xl border border-slate-200 px-2 py-1 text-sm" type="number" min="1" value={item.quantity} onChange={(e) => updateCartItem(index, e.target.value)} />
                        </td>
                        <td className="px-3 py-3">{formatCurrency(item.unit_price)}</td>
                        <td className="px-3 py-3">{formatCurrency(Number(item.unit_price || 0) * Number(item.quantity || 0))}</td>
                        <td className="px-3 py-3">
                          <button type="button" onClick={() => removeCartItem(index)} className="rounded-full border border-rose-200 p-2 text-rose-700">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4"><EmptyState title="Cart is empty" description="Add medicines to build the bill." /></div>
            )}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
              <div className="mt-2 flex items-center justify-between"><span>GST</span><span>{formatCurrency(totals.gstAmount)}</span></div>
              <div className="mt-2 flex items-center justify-between"><span>Discount</span><span>{formatCurrency(totals.discountAmount)}</span></div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900"><span>Grand Total</span><span>{formatCurrency(totals.totalAmount)}</span></div>
            </div>

            <form onSubmit={onSubmit} className="mt-4">
              <button disabled={submitting || !cart.length} type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">
                <ReceiptText size={16} /> {submitting ? 'Creating invoice...' : 'Generate Bill'}
              </button>
              {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
            </form>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent Bills</h2>
            <p className="text-sm text-slate-500">Invoices created by the backend billing API.</p>
          </div>
        </div>
        {recentInvoices.length ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium">{invoice.invoice_no}</td>
                    <td className="px-4 py-3">{invoice.customer?.customer_name || 'Walk-in'}</td>
                    <td className="px-4 py-3">{invoice.items?.length || 0}</td>
                    <td className="px-4 py-3">{formatCurrency(invoice.total_amount)}</td>
                    <td className="px-4 py-3">{invoice.payment_status}</td>
                    <td className="px-4 py-3">{invoice.invoice_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6"><EmptyState title="No invoices generated yet." description="Create your first bill to see recent activity here." /></div>
        )}
      </div>

      <Modal open={customerModalOpen} title="Add Customer" description="Create a customer record that can be reused for billing." onClose={() => setCustomerModalOpen(false)}>
        <form onSubmit={addCustomer} className="space-y-3">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Customer name" value={customerForm.customer_name} onChange={(e) => setCustomerForm({ ...customerForm, customer_name: e.target.value })} required />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} required />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Address" value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} />
          <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Save Customer</button>
        </form>
      </Modal>
    </div>
  );
}
