const today = new Date();
const dateFromToday = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const medicines = [
  { medicine_id: 1, medicine_name: 'Himalaya Face Wash', manufacturer: 'Himalaya Wellness', composition: 'Neem and turmeric', category: 'Personal Care', hsn_code: '330499', gst_percent: 18 },
  { medicine_id: 2, medicine_name: 'Azithral 500 Tablet', manufacturer: 'Alembic Pharmaceuticals', composition: 'Azithromycin 500mg', category: 'Antibiotic', hsn_code: '300490', gst_percent: 12 },
  { medicine_id: 3, medicine_name: 'Allegra 120mg Tablet', manufacturer: 'Sanofi', composition: 'Fexofenadine 120mg', category: 'Anti-allergic', hsn_code: '300490', gst_percent: 12 },
  { medicine_id: 4, medicine_name: 'Avil 25 Tablet', manufacturer: 'Sanofi', composition: 'Pheniramine maleate 25mg', category: 'Anti-allergic', hsn_code: '300490', gst_percent: 12 },
  { medicine_id: 5, medicine_name: 'Avastin 400mg Injection', manufacturer: 'Roche', composition: 'Bevacizumab 400mg', category: 'Injection', hsn_code: '300212', gst_percent: 12 },
];

const customers = [
  { customer_id: 1, customer_name: 'John Doe', phone: '9876543210', email: 'john.doe@example.com', address: 'Koregaon Park, Pune' },
  { customer_id: 2, customer_name: 'Sagar', phone: '9123456780', email: 'sagar@example.com', address: 'Baner, Pune' },
  { customer_id: 3, customer_name: 'Raj', phone: '9988776655', email: 'raj@example.com', address: 'Viman Nagar, Pune' },
];

const suppliers = [
  { supplier_id: 1, supplier_name: 'Medline Distributors', phone: '9123456701', email: 'orders@medline.example', gst_number: '27AABCM1234D1Z5', address: 'Market Yard, Pune' },
  { supplier_id: 2, supplier_name: 'Wellness Pharma Supply', phone: '9123456702', email: 'sales@wellness.example', gst_number: '27AABCP5678E1Z2', address: 'Bhosari, Pune' },
];

const inventory = [
  { stock_id: 1, medicine_id: 1, batch_no: 'HFW2401', expiry_date: dateFromToday(240), quantity: 42, unit_cost: 115, purchase_price: 115, selling_price: 165, min_stock: 10, location: 'A-01' },
  { stock_id: 2, medicine_id: 2, batch_no: 'AZI2408', expiry_date: dateFromToday(155), quantity: 7, unit_cost: 92, purchase_price: 92, selling_price: 128, min_stock: 10, location: 'A-02' },
  { stock_id: 3, medicine_id: 3, batch_no: 'ALG2410', expiry_date: dateFromToday(18), quantity: 16, unit_cost: 78, purchase_price: 78, selling_price: 110, min_stock: 8, location: 'B-01' },
  { stock_id: 4, medicine_id: 4, batch_no: 'AVI2406', expiry_date: dateFromToday(-8), quantity: 4, unit_cost: 32, purchase_price: 32, selling_price: 48, min_stock: 6, location: 'B-02' },
  { stock_id: 5, medicine_id: 5, batch_no: 'AVA2403', expiry_date: dateFromToday(90), quantity: 9, unit_cost: 28500, purchase_price: 28500, selling_price: 32200, min_stock: 2, location: 'C-01' },
];

const invoices = [
  {
    invoice_id: 1, invoice_no: 'INV-DEMO-001', invoice_date: dateFromToday(-2), customer_id: 1, payment_method: 'UPI', payment_status: 'Paid', gst_percent: 12, discount_amount: 0, subtotal: 256, gst_amount: 30.72, total_amount: 286.72,
    customer: customers[0], items: [{ medicine_id: 2, medicine_name: medicines[1].medicine_name, batch_no: 'AZI2408', expiry_date: inventory[1].expiry_date, quantity: 2, unit_price: 128, gst_percent: 12, gst_amount: 30.72, line_total: 286.72 }],
  },
  {
    invoice_id: 2, invoice_no: 'INV-DEMO-002', invoice_date: dateFromToday(-6), customer_id: 2, payment_method: 'Cash', payment_status: 'Paid', gst_percent: 18, discount_amount: 0, subtotal: 330, gst_amount: 59.4, total_amount: 389.4,
    customer: customers[1], items: [{ medicine_id: 1, medicine_name: medicines[0].medicine_name, batch_no: 'HFW2401', expiry_date: inventory[0].expiry_date, quantity: 2, unit_price: 165, gst_percent: 18, gst_amount: 59.4, line_total: 389.4 }],
  },
];

const purchases = [
  { purchase_id: 1, supplier_id: 1, supplier: suppliers[0], invoice_no: 'PO-DEMO-104', items: [{ medicine_id: 2 }], total_amount: 4600, payment_status: 'Paid', purchase_date: dateFromToday(-12) },
  { purchase_id: 2, supplier_id: 2, supplier: suppliers[1], invoice_no: 'PO-DEMO-105', items: [{ medicine_id: 1 }], total_amount: 5750, payment_status: 'Pending', purchase_date: dateFromToday(-4) },
];

const settings = {
  pharmacy_name: 'GenPharma Demo Pharmacy', owner_name: 'Demo Pharmacist', gstin: '27AAACG1234A1Z5', drug_license_number: 'DL-DEMO-2024', address_line_1: 'MG Road', address_line_2: '', city: 'Pune', state: 'Maharashtra', pin_code: '411001', phone_number: '7620604870', email: 'gen.pharma.official@gmail.com', website: '', logo_url: '', invoice_footer: 'Thank you for choosing GenPharma.', currency: 'INR', timezone: 'Asia/Kolkata',
};

const clone = (value) => structuredClone(value);
let state;

export function resetDemoData() {
  state = { medicines: clone(medicines), customers: clone(customers), suppliers: clone(suppliers), inventory: clone(inventory), invoices: clone(invoices), purchases: clone(purchases), settings: clone(settings) };
}

resetDemoData();

export function getDemoData() {
  return state;
}

export function enrichInventory() {
  return state.inventory.map((batch) => {
    const expiry = new Date(`${batch.expiry_date}T00:00:00`);
    const daysToExpiry = Math.ceil((expiry - new Date()) / 86400000);
    return { ...batch, medicine: state.medicines.find((medicine) => medicine.medicine_id === batch.medicine_id), daysToExpiry, isExpired: daysToExpiry < 0, isExpiringSoon: daysToExpiry >= 0 && daysToExpiry <= 30, isLowStock: Number(batch.quantity) <= Number(batch.min_stock || 5) };
  });
}

export function demoSummary() {
  const revenue = state.invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
  const cost = state.invoices.reduce((sum, invoice) => sum + (invoice.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0) * Number(state.inventory.find((batch) => batch.medicine_id === item.medicine_id)?.unit_cost || 0), 0), 0);
  const topSellingMedicines = state.medicines.map((medicine) => ({ medicine_name: medicine.medicine_name, total_qty: state.invoices.reduce((sum, invoice) => sum + (invoice.items || []).filter((item) => item.medicine_id === medicine.medicine_id).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0) })).filter((item) => item.total_qty > 0);
  return { todaySales: revenue, todayProfit: revenue - cost, monthlyRevenue: revenue, billsToday: state.invoices.length, totalMedicines: state.medicines.length, lowStockMedicines: enrichInventory().filter((item) => item.isLowStock).length, expiredMedicines: enrichInventory().filter((item) => item.isExpired).length, expiringInSevenDays: enrichInventory().filter((item) => item.daysToExpiry >= 0 && item.daysToExpiry <= 7).length, topSellingMedicines };
}

export function demoReports() {
  const sales = state.invoices.flatMap((invoice) => (invoice.items || []).map((item) => ({ invoice_no: invoice.invoice_no, invoice_date: invoice.invoice_date, customer_name: invoice.customer?.customer_name || 'Walk-in Customer', customer_phone: invoice.customer?.phone || '', medicine_name: item.medicine_name, batch_no: item.batch_no, expiry_date: item.expiry_date, quantity: item.quantity, unit_price: item.unit_price, gst_percent: item.gst_percent, gst_amount: item.gst_amount, line_total: item.line_total, invoice_total: invoice.total_amount, payment_status: invoice.payment_status })));
  const inventoryRows = enrichInventory().map((item) => ({ medicine_name: item.medicine?.medicine_name, batch_no: item.batch_no, expiry_date: item.expiry_date, quantity: item.quantity, selling_price: item.selling_price, location: item.location }));
  return { sales, gst: state.invoices.map((invoice) => ({ invoice_no: invoice.invoice_no, invoice_date: invoice.invoice_date, taxable_amount: invoice.subtotal, gst_amount: invoice.gst_amount, total_amount: invoice.total_amount })), inventory: inventoryRows, purchases: state.purchases.map((purchase) => ({ purchase_date: purchase.purchase_date, invoice_no: purchase.invoice_no, supplier_name: purchase.supplier?.supplier_name, total_amount: purchase.total_amount, payment_status: purchase.payment_status })), customers: clone(state.customers), suppliers: clone(state.suppliers), batches: inventoryRows.map(({ batch_no, medicine_name, expiry_date, quantity, location }) => ({ batch_no, medicine_name, expiry_date, quantity, location })) };
}

export function createDemoInvoice(payload) {
  const customer = state.customers.find((item) => item.customer_id === Number(payload.customer_id));
  const items = (payload.items || []).map((item) => {
    const medicine = state.medicines.find((entry) => entry.medicine_id === Number(item.medicine_id));
    const batch = state.inventory.find((entry) => entry.medicine_id === Number(item.medicine_id) && entry.quantity >= Number(item.quantity));
    const gstPercent = Number(payload.gst_percent || medicine?.gst_percent || 0);
    const unitPrice = Number(item.unit_price || batch?.selling_price || 0);
    const gstAmount = Number(((unitPrice * Number(item.quantity || 0) * gstPercent) / 100).toFixed(2));
    if (batch) batch.quantity -= Number(item.quantity || 0);
    return { ...item, medicine_id: Number(item.medicine_id), medicine_name: medicine?.medicine_name, batch_no: batch?.batch_no || 'DEMO-BATCH', expiry_date: batch?.expiry_date || dateFromToday(180), unit_price: unitPrice, gst_percent: gstPercent, gst_amount: gstAmount, line_total: Number((unitPrice * Number(item.quantity || 0) + gstAmount).toFixed(2)) };
  });
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const gstAmount = items.reduce((sum, item) => sum + item.gst_amount, 0);
  const invoice = { invoice_id: Date.now(), invoice_no: payload.invoice_no, invoice_date: payload.invoice_date, customer_id: payload.customer_id, customer, payment_method: payload.payment_method, payment_status: payload.payment_status, gst_percent: payload.gst_percent, discount_amount: Number(payload.discount_amount || 0), subtotal, gst_amount: gstAmount, total_amount: Number((subtotal - Number(payload.discount_amount || 0) + gstAmount).toFixed(2)), items };
  state.invoices.unshift(invoice);
  return { data: { invoice } };
}

export function demoCustomerHistory(customerId) {
  const customer = state.customers.find((item) => item.customer_id === Number(customerId));
  const customerInvoices = state.invoices.filter((invoice) => invoice.customer_id === Number(customerId));
  return { customer, invoices: customerInvoices, stats: { totalPurchases: customerInvoices.length, totalSpent: customerInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0) } };
}
