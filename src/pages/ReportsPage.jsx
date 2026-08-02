import { useEffect, useMemo, useState } from 'react';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SearchField } from '../components/common/SearchField';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getReports, getSettings } from '../services/pharmaService';
import { exportReportExcel, exportReportPdf } from '../utils/exporters';

const reportMeta = [
  { key: 'sales', title: 'Sales Report', columns: ['invoice_no', 'invoice_date', 'customer_name', 'customer_phone', 'medicine_name', 'batch_no', 'expiry_date', 'quantity', 'unit_price', 'gst_percent', 'gst_amount', 'line_total', 'invoice_total', 'payment_status'] },
  { key: 'gst', title: 'GST Report', columns: ['invoice_no', 'invoice_date', 'taxable_amount', 'gst_amount', 'total_amount'] },
  { key: 'inventory', title: 'Inventory Report', columns: ['medicine_name', 'batch_no', 'expiry_date', 'quantity', 'selling_price', 'location'] },
  { key: 'purchases', title: 'Purchase Report', columns: ['purchase_date', 'invoice_no', 'supplier_name', 'total_amount', 'payment_status'] },
  { key: 'customers', title: 'Customer Report', columns: ['customer_name', 'phone', 'email', 'address'] },
  { key: 'suppliers', title: 'Supplier Report', columns: ['supplier_name', 'phone', 'email', 'gst_number', 'address'] },
  { key: 'batches', title: 'Batch Report', columns: ['batch_no', 'medicine_name', 'expiry_date', 'quantity', 'location'] },
];

export function ReportsPage() {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [activeReport, setActiveReport] = useState('sales');
  const [settings, setSettings] = useState(null);
  const rowsPerPage = 8;

  useEffect(() => {
    const load = async () => {
      try {
        const [data, settingsData] = await Promise.all([getReports(), getSettings()]);
        setReports(data);
        setSettings(settingsData || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Cannot connect to server.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totals = useMemo(() => ({
    sales: reports.sales?.reduce((sum, row) => sum + Number(row.total_amount || 0), 0) || 0,
    purchases: reports.purchases?.reduce((sum, row) => sum + Number(row.total_amount || 0), 0) || 0,
  }), [reports]);

  const activeRows = useMemo(() => {
    const report = reportMeta.find((item) => item.key === activeReport);
    const source = reports[activeReport] || [];
    if (!report) return [];

    return source.filter((row) => {
      const haystack = Object.values(row).join(' ').toLowerCase();
      return haystack.includes(debouncedSearch.toLowerCase());
    });
  }, [activeReport, debouncedSearch, reports]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return activeRows.slice(start, start + rowsPerPage);
  }, [activeRows, page]);

  useEffect(() => {
    setPage(1);
  }, [activeReport, debouncedSearch]);

  const handleExportExcel = () => {
    const report = reportMeta.find((item) => item.key === activeReport);
    if (!report) return;
    exportReportExcel(report.title, activeRows, report.columns);
  };

  const handleExportPdf = () => {
    const report = reportMeta.find((item) => item.key === activeReport);
    if (!report) return;
    exportReportPdf(report.title, activeRows, report.columns, settings);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Operational Reports</h2>
            <p className="text-sm text-slate-500">Professional tables from the backend report endpoints.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExportPdf} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600"><Download size={16} /> PDF</button>
            <button type="button" onClick={handleExportExcel} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600"><FileSpreadsheet size={16} /> Excel</button>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600"><Printer size={16} /> Print</button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Sales value: ₹{Number(totals.sales || 0).toLocaleString('en-IN')}</div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Purchase value: ₹{Number(totals.purchases || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <SearchField value={search} onChange={setSearch} placeholder="Search report" className="bg-slate-50" />
          </div>
          <select className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" value={activeReport} onChange={(e) => setActiveReport(e.target.value)}>
            {reportMeta.map((report) => <option key={report.key} value={report.key}>{report.title}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">{reportMeta.find((report) => report.key === activeReport)?.title}</h2>
          <p className="text-sm text-slate-500">{activeRows.length} records</p>
        </div>
        {activeRows.length ? (
          <>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {reportMeta.find((report) => report.key === activeReport)?.columns.map((column) => <th key={column} className="px-4 py-3">{column.replace(/_/g, ' ')}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, index) => (
                    <tr key={`${row.invoice_no || row.batch_no || row.customer_name || row.purchase_date || index}`} className="border-t border-slate-200">
                      {reportMeta.find((report) => report.key === activeReport)?.columns.map((column) => <td key={column} className="px-4 py-3">{row[column] ?? '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">Page {page} of {Math.max(1, Math.ceil(activeRows.length / rowsPerPage))}</p>
              <div className="flex gap-2">
                <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 disabled:opacity-50">Previous</button>
                <button type="button" disabled={page * rowsPerPage >= activeRows.length} onClick={() => setPage((value) => value + 1)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-4"><EmptyState title="No Reports" description="No report data is available from the backend for this section." /></div>
        )}
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
