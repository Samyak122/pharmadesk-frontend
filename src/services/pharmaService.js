import api from '../api/client';
import { createDemoInvoice, demoCustomerHistory, demoReports, demoSummary, enrichInventory, getDemoData } from './demoData';

const demo = () => !localStorage.getItem('pharmadesk_token') && window.__GENPHARMA_DEMO_MODE__ === true;
const demoResult = (data) => Promise.resolve(data);

export async function getDashboardSummary() {
  if (demo()) return demoResult(demoSummary());
  const { data } = await api.get('/dashboard/summary');
  return data;
}

export async function getSalesChart() {
  if (demo()) return demoResult(getDemoData().invoices.map((invoice) => ({ date: invoice.invoice_date, sales: invoice.total_amount })));
  const { data } = await api.get('/dashboard/sales-chart');
  return data || [];
}

export async function searchMedicines(query) {
  if (demo()) return demoResult(getDemoData().medicines.filter((medicine) => medicine.medicine_name.toLowerCase().includes(String(query || '').toLowerCase())));
  const { data } = await api.get('/medicines/search', { params: { q: query } });
  return data || [];
}

export async function createMedicine(payload) {
  if (demo()) {
    const data = getDemoData();
    const medicine = { ...payload, medicine_id: Math.max(0, ...data.medicines.map((item) => item.medicine_id)) + 1 };
    data.medicines.push(medicine);
    return demoResult(medicine);
  }
  const { data } = await api.post('/medicines', payload);
  return data;
}

export async function searchInventoryStock(query) {
  if (demo()) return demoResult(enrichInventory().filter((batch) => batch.medicine?.medicine_name.toLowerCase().includes(String(query || '').toLowerCase())));
  const { data } = await api.get('/inventory/search', { params: { q: query } });
  return data || [];
}

export async function createInventory(payload) {
  if (demo()) {
    const data = getDemoData();
    const batch = { ...payload, stock_id: Math.max(0, ...data.inventory.map((item) => item.stock_id)) + 1, purchase_price: payload.unit_cost };
    data.inventory.push(batch);
    return demoResult(batch);
  }
  const { data } = await api.post('/inventory', payload);
  return data;
}

export async function listInventory(filters = {}) {
  if (demo()) {
    let rows = enrichInventory();
    if (filters.search) rows = rows.filter((item) => item.medicine?.medicine_name.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.medicine_id) rows = rows.filter((item) => item.medicine_id === Number(filters.medicine_id));
    if (filters.lowStock) rows = rows.filter((item) => item.isLowStock);
    if (filters.expiringSoon) rows = rows.filter((item) => item.isExpiringSoon);
    if (filters.expired) rows = rows.filter((item) => item.isExpired);
    return demoResult(rows);
  }
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.lowStock) params.set('lowStock', 'true');
  if (filters.lowStockThreshold) params.set('lowStockThreshold', String(filters.lowStockThreshold));
  if (filters.expiringSoon) params.set('expiringSoon', String(filters.expiringSoon));
  if (filters.expired) params.set('expired', 'true');
  if (filters.medicine_id) params.set('medicine_id', String(filters.medicine_id));
  const { data } = await api.get(`/inventory${params.toString() ? `?${params.toString()}` : ''}`);
  return data || [];
}

export async function updateInventory(stockId, payload) {
  if (demo()) {
    const batch = getDemoData().inventory.find((item) => item.stock_id === Number(stockId));
    if (batch) Object.assign(batch, payload);
    return demoResult(batch);
  }
  const { data } = await api.put(`/inventory/${stockId}`, payload);
  return data;
}

export async function deleteInventory(stockId) {
  if (demo()) {
    const data = getDemoData();
    data.inventory = data.inventory.filter((item) => item.stock_id !== Number(stockId));
    return demoResult({ success: true });
  }
  const { data } = await api.delete(`/inventory/${stockId}`);
  return data;
}

export async function getFefoBatches(medicineId) {
  if (demo()) return demoResult(enrichInventory().filter((item) => item.medicine_id === Number(medicineId)).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)));
  const { data } = await api.get('/inventory/fefo', { params: { medicine_id: medicineId } });
  return data || [];
}

export async function createPurchase(payload) {
  if (demo()) {
    const data = getDemoData();
    const supplier = data.suppliers.find((item) => item.supplier_id === Number(payload.supplier_id));
    const item = payload.items?.[0] || {};
    const purchase = { purchase_id: Date.now(), supplier_id: payload.supplier_id, supplier, invoice_no: payload.invoice_no || `PO-DEMO-${Date.now()}`, items: payload.items || [], total_amount: Number(item.quantity || 0) * Number(item.unit_cost || 0), payment_status: payload.payment_status, purchase_date: new Date().toISOString().slice(0, 10) };
    data.purchases.unshift(purchase);
    data.inventory.push({ ...item, stock_id: Date.now(), purchase_price: item.unit_cost, medicine_id: Number(item.medicine_id) });
    return demoResult(purchase);
  }
  const { data } = await api.post('/purchases', payload);
  return data;
}

export async function extractSupplierInvoice(payload) {
  if (demo()) {
    return demoResult({
      supplier: { name: 'Demo Supplier', gstin: '27AABCM1234C1Z5', invoice_number: 'INV-DEM-101', invoice_date: '2026-08-15' },
      items: [
        {
          medicine_name: 'PED COFOL Drops',
          batch_number: 'G226F003',
          expiry_date: '2027-11',
          quantity: 2,
          mrp: 184,
          purchase_rate: 70,
          gst_percentage: 5,
          hsn: '3004',
          validation: { valid: true, message: 'Row passed validation.' },
          confidence: { medicine_name: { value: 'PED COFOL Drops', confidence: 0.96 } },
        },
      ],
      quality_ok: true,
      warning: '',
    });
  }
  const { data } = await api.post('/ocr/extract', payload);
  return data;
}

export async function confirmSupplierInvoice(payload) {
  if (demo()) {
    return demoResult({
      imported_count: payload.items.length,
      supplier: payload.supplier,
      purchase: { purchase_id: Date.now(), invoice_no: payload.supplier?.invoice_number || 'DEMO-OCR' },
    });
  }
  const { data } = await api.post('/ocr/confirm', payload);
  return data;
}

export async function listPurchases() {
  if (demo()) return demoResult(getDemoData().purchases);
  const { data } = await api.get('/purchases');
  return data || [];
}

export async function createCustomer(payload) {
  if (demo()) {
    const data = getDemoData();
    const customer = { ...payload, customer_id: Math.max(0, ...data.customers.map((item) => item.customer_id)) + 1 };
    data.customers.push(customer);
    return demoResult(customer);
  }
  const { data } = await api.post('/customers', payload);
  return data;
}

export async function listCustomers(search = '') {
  if (demo()) return demoResult(getDemoData().customers.filter((item) => `${item.customer_name} ${item.phone}`.toLowerCase().includes(String(search).toLowerCase())));
  const { data } = await api.get('/customers', { params: { search } });
  return data || [];
}

export async function searchCustomersByPhone(phone) {
  if (demo()) return demoResult(getDemoData().customers.filter((item) => item.phone.includes(String(phone || ''))));
  const { data } = await api.get('/customers/search', { params: { phone } });
  return data || [];
}

export async function updateCustomer(customerId, payload) {
  if (demo()) {
    const customer = getDemoData().customers.find((item) => item.customer_id === Number(customerId));
    if (customer) Object.assign(customer, payload);
    return demoResult(customer);
  }
  const { data } = await api.put(`/customers/${customerId}`, payload);
  return data;
}

export async function getCustomerHistory(customerId) {
  if (demo()) return demoResult(demoCustomerHistory(customerId));
  const { data } = await api.get(`/customers/${customerId}/history`);
  return data;
}

export async function createInvoice(payload) {
  if (demo()) return demoResult(createDemoInvoice(payload));
  const { data } = await api.post('/billing', payload);
  return data;
}

export async function getInvoiceById(invoiceId) {
  if (demo()) return demoResult(getDemoData().invoices.find((invoice) => invoice.invoice_id === Number(invoiceId)));
  const { data } = await api.get(`/billing/${invoiceId}`);
  return data;
}

export async function updateInvoice(invoiceId, payload) {
  if (demo()) {
    const invoice = getDemoData().invoices.find((item) => item.invoice_id === Number(invoiceId));
    if (invoice) Object.assign(invoice, payload);
    return demoResult(invoice);
  }
  const { data } = await api.put(`/billing/${invoiceId}`, payload);
  return data;
}

export async function listInvoices() {
  if (demo()) return demoResult(getDemoData().invoices);
  const { data } = await api.get('/billing');
  return data || [];
}

export async function getSettings() {
  if (demo()) return demoResult(getDemoData().settings);
  const { data } = await api.get('/settings');
  return data || {};
}

export async function updateSettings(payload) {
  if (demo()) {
    Object.assign(getDemoData().settings, payload);
    return demoResult(getDemoData().settings);
  }
  const { data } = await api.put('/settings', payload);
  return data;
}

export async function getSuppliers() {
  if (demo()) return demoResult(getDemoData().suppliers);
  const { data } = await api.get('/reports/suppliers');
  return data || [];
}

export async function getReports() {
  if (demo()) return demoResult(demoReports());
  const [sales, gst, inventory, purchases, customers, suppliers, batches] = await Promise.all([
    api.get('/reports/sales'),
    api.get('/reports/gst'),
    api.get('/reports/inventory'),
    api.get('/reports/purchases'),
    api.get('/reports/customers'),
    api.get('/reports/suppliers'),
    api.get('/reports/batches'),
  ]);

  return {
    sales: sales.data || [],
    gst: gst.data || [],
    inventory: inventory.data || [],
    purchases: purchases.data || [],
    customers: customers.data || [],
    suppliers: suppliers.data || [],
    batches: batches.data || [],
  };
}

export function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function buildInvoiceNumber(invoices = []) {
  const nextIndex = (invoices.length || 0) + 1;
  const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${dateKey}-${String(nextIndex).padStart(3, '0')}`;
}
