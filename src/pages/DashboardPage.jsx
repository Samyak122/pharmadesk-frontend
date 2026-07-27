import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, DollarSign, Package, AlertTriangle, CalendarRange, Boxes, ReceiptText, ShoppingCart, UserPlus, Building2 } from 'lucide-react';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { getDashboardSummary, getSalesChart, listInventory, listInvoices } from '../services/pharmaService';
import { formatMetricValue } from '../utils/dashboardUtils';

const cards = [
  { key: 'todaySales', title: 'Today\'s Sales', icon: DollarSign, accent: 'from-emerald-500 to-emerald-600', type: 'currency' },
  { key: 'todayProfit', title: 'Today\'s Profit', icon: ArrowUpRight, accent: 'from-sky-500 to-sky-600', type: 'currency' },
  { key: 'monthlyRevenue', title: 'Monthly Revenue', icon: DollarSign, accent: 'from-violet-500 to-violet-600', type: 'currency' },
  { key: 'billsToday', title: 'Bills Today', icon: ReceiptText, accent: 'from-amber-500 to-amber-600', type: 'count' },
  { key: 'totalMedicines', title: 'Total Medicines', icon: Package, accent: 'from-indigo-500 to-indigo-600', type: 'count' },
  { key: 'lowStockMedicines', title: 'Low Stock', icon: AlertTriangle, accent: 'from-rose-500 to-rose-600', type: 'count' },
  { key: 'expiredMedicines', title: 'Expired', icon: Boxes, accent: 'from-slate-700 to-slate-800', type: 'count' },
  { key: 'expiringInSevenDays', title: 'Expiring Soon', icon: CalendarRange, accent: 'from-cyan-500 to-cyan-600', type: 'count' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [inventoryBatches, setInventoryBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      const [summaryData, chartResponse, inventoryData, invoiceData] = await Promise.all([
        getDashboardSummary(),
        getSalesChart(),
        listInventory({}),
        listInvoices(),
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const billsToday = (invoiceData || []).filter((invoice) => (invoice.invoice_date || '').slice(0, 10) === today).length;
      const totalMedicines = new Set((inventoryData || []).map((batch) => batch.medicine_id ?? batch.medicine?.medicine_id).filter(Boolean)).size;
      const lowStockMedicines = (inventoryData || []).filter((batch) => Number(batch.quantity || 0) <= Number(batch.min_stock || 5)).length;
      const expiredMedicines = (inventoryData || []).filter((batch) => batch.isExpired).length;
      const expiringInSevenDays = (inventoryData || []).filter((batch) => batch.isExpiringSoon).length;

      setSummary({
        ...summaryData,
        billsToday,
        totalMedicines,
        lowStockMedicines,
        expiredMedicines,
        expiringInSevenDays,
      });
      setChartData(chartResponse || []);
      setInventoryBatches(inventoryData || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const handleRefresh = () => {
      loadDashboard();
    };
    window.addEventListener('pharmadesk:refresh-dashboard', handleRefresh);
    return () => window.removeEventListener('pharmadesk:refresh-dashboard', handleRefresh);
  }, []);

  const metricValue = (card, value) => formatMetricValue(card.type, value);

  const chartSeries = useMemo(() => {
    if (!chartData.length) return [];
    return chartData.map((item) => ({
      name: item.date || 'N/A',
      sales: Number(item.sales || 0),
    }));
  }, [chartData]);

  const lowStockItems = useMemo(() => (inventoryBatches || []).filter((batch) => Number(batch.quantity || 0) <= Number(batch.min_stock || 5)).slice(0, 6), [inventoryBatches]);
  const expiryItems = useMemo(() => (inventoryBatches || []).filter((batch) => batch.isExpired || batch.isExpiringSoon).sort((a, b) => (Number(a.daysToExpiry ?? 9999) - Number(b.daysToExpiry ?? 9999))).slice(0, 6), [inventoryBatches]);

  if (loading) return <Loader label="Loading dashboard" />;
  if (error) return <EmptyState title="Unable to load dashboard" description={error} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, title, icon: Icon, accent, type }) => (
          <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white`}>
              <Icon size={18} />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metricValue({ type }, summary?.[key])}</p>
            {key === 'todaySales' && Number(summary?.todaySales || 0) === 0 ? <p className="mt-1 text-sm text-slate-500">No Sales Today</p> : null}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: 'New Bill', icon: ReceiptText, route: '/billing' },
          { label: 'Purchase Stock', icon: ShoppingCart, route: '/purchases' },
          { label: 'Add Customer', icon: UserPlus, route: '/customers' },
          { label: 'Add Supplier', icon: Building2, route: '/suppliers' },
        ].map(({ label, icon: Icon, route }) => (
          <button key={label} type="button" onClick={() => navigate(route)} className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300">
            <div>
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="mt-1 text-sm text-slate-500">Jump to the relevant workflow</p>
            </div>
            <div className="rounded-2xl bg-slate-900 p-2 text-white"><Icon size={16} /></div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Revenue Trend</h3>
              <p className="text-sm text-slate-500">Based on invoices from the backend</p>
            </div>
          </div>
          {chartSeries.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartSeries}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#0f172a" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No Revenue Data Available" description="No sales data is available from the backend yet." />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Low Stock Medicines</h3>
            <p className="mt-1 text-sm text-slate-500">Inventory alerts sourced from the backend</p>
            <div className="mt-6 space-y-3">
              {lowStockItems.length ? lowStockItems.map((batch, index) => (
                <div key={`${batch.stock_id}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{batch.medicine?.medicine_name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500">Remaining {batch.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">Min {batch.min_stock || 5}</span>
                </div>
              )) : <EmptyState title="No Low Stock Medicines" description="Inventory is healthy right now." />}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Expiry Alerts</h3>
            <p className="mt-1 text-sm text-slate-500">Medicines nearing expiry from backend inventory data</p>
            <div className="mt-6 space-y-3">
              {expiryItems.length ? expiryItems.map((batch, index) => (
                <div key={`${batch.stock_id}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{batch.medicine?.medicine_name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500">{batch.batch_no}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{batch.daysToExpiry >= 0 ? `${batch.daysToExpiry}d` : 'Expired'}</span>
                </div>
              )) : <EmptyState title="No Expiring Medicines" description="No batches require expiry attention at the moment." />}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Top Selling Medicines</h3>
        <p className="mt-1 text-sm text-slate-500">From billing history</p>
        <div className="mt-6 space-y-3">
          {(summary?.topSellingMedicines || []).length ? summary.topSellingMedicines.map((item, index) => (
            <div key={`${item.medicine_name}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="font-medium text-slate-800">{item.medicine_name}</p>
                <p className="text-sm text-slate-500">Units sold</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">{item.total_qty}</span>
            </div>
          )) : <EmptyState title="No Sales Yet" description="Billing activity will appear here as it is recorded." />}
        </div>
      </div>
    </div>
  );
}
