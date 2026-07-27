import { Download, Printer, RotateCcw, PlusCircle } from 'lucide-react';
import { InvoicePrint } from './InvoicePrint';
import { exportInvoicePdf } from '../../utils/exporters';

export function InvoicePreview({ invoice, settings, onPrint, onDownload, onBack, onNewBill }) {
  if (!invoice) return null;

  return (
    <div className="space-y-6">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Invoice Preview</h3>
          <p className="text-sm text-slate-500">A4-ready invoice generated from the backend billing response.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPrint} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"><Printer size={16} /> Print</button>
          <button type="button" onClick={() => onDownload?.(invoice, settings)} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"><Download size={16} /> Download PDF</button>
          <button type="button" onClick={onBack} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"><RotateCcw size={16} /> Back</button>
          <button type="button" onClick={onNewBill} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"><PlusCircle size={16} /> Create New Bill</button>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm print:bg-white print:shadow-none print:p-0 print:border-0">
        <div className="print:hidden">
          <InvoicePrint invoice={invoice} settings={settings} />
        </div>
        <div className="hidden print:block">
          <InvoicePrint invoice={invoice} settings={settings} />
        </div>
      </div>
    </div>
  );
}
