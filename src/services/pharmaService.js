import api from '../api/client';

export async function getDashboardSummary() {
  const { data } = await api.get('/dashboard/summary');
  return data;
}

export async function getSalesChart() {
  const { data } = await api.get('/dashboard/sales-chart');
  return data || [];
}

export async function searchMedicines(query) {
  const { data } = await api.get('/medicines/search', { params: { q: query } });
  return data || [];
}

export async function createMedicine(payload) {
  const { data } = await api.post('/medicines', payload);
  return data;
}

export async function searchInventoryStock(query) {
  const { data } = await api.get('/inventory/search', { params: { q: query } });
  return data || [];
}

export async function createInventory(payload) {
  const { data } = await api.post('/inventory', payload);
  return data;
}

export async function listInventory(filters = {}) {
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
  const { data } = await api.put(`/inventory/${stockId}`, payload);
  return data;
}

export async function deleteInventory(stockId) {
  const { data } = await api.delete(`/inventory/${stockId}`);
  return data;
}

export async function getFefoBatches(medicineId) {
  const { data } = await api.get('/inventory/fefo', { params: { medicine_id: medicineId } });
  return data || [];
}

export async function createPurchase(payload) {
  const { data } = await api.post('/purchases', payload);
  return data;
}

export async function listPurchases() {
  const { data } = await api.get('/purchases');
  return data || [];
}

export async function createCustomer(payload) {
  const { data } = await api.post('/customers', payload);
  return data;
}

export async function listCustomers(search = '') {
  const { data } = await api.get('/customers', { params: { search } });
  return data || [];
}

export async function searchCustomersByPhone(phone) {
  const { data } = await api.get('/customers/search', { params: { phone } });
  return data || [];
}

export async function updateCustomer(customerId, payload) {
  const { data } = await api.put(`/customers/${customerId}`, payload);
  return data;
}

export async function getCustomerHistory(customerId) {
  const { data } = await api.get(`/customers/${customerId}/history`);
  return data;
}

export async function createInvoice(payload) {
  const { data } = await api.post('/billing', payload);
  return data;
}

export async function getInvoiceById(invoiceId) {
  const { data } = await api.get(`/billing/${invoiceId}`);
  return data;
}

export async function updateInvoice(invoiceId, payload) {
  const { data } = await api.put(`/billing/${invoiceId}`, payload);
  return data;
}

export async function listInvoices() {
  const { data } = await api.get('/billing');
  return data || [];
}

export async function getSettings() {
  const { data } = await api.get('/settings');
  return data || {};
}

export async function updateSettings(payload) {
  const { data } = await api.put('/settings', payload);
  return data;
}

export async function getSuppliers() {
  const { data } = await api.get('/reports/suppliers');
  return data || [];
}

export async function getReports() {
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
