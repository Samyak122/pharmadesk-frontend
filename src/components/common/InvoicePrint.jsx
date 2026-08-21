import { formatCurrency } from '../../services/pharmaService';
import { resolvePharmacyLogo } from '../../utils/logoUtils';

export function InvoicePrint({ invoice, settings }) {
  if (!invoice) return null;

  const rows = (invoice?.items || []).map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || 0);
    const lineSubtotal = Number((unitPrice * quantity).toFixed(2));
    const gstPercent = Number(item.gst_percent ?? invoice?.gst_percent ?? 0);
    const gstAmount = Number(((lineSubtotal * gstPercent) / 100).toFixed(2));
    const lineTotal = Number((lineSubtotal + gstAmount).toFixed(2));

    return {
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

  const subtotal = rows.reduce((sum, row) => sum + Number(row.unit_price || 0) * Number(row.quantity || 0), 0);
  const discountAmount = Number(invoice?.discount_amount || 0);
  const gstAmount = Number(invoice?.gst_amount ?? rows.reduce((sum, row) => sum + Number(row.gst_amount || 0), 0));
  const totalAmount = Number((subtotal - discountAmount + gstAmount).toFixed(2));
  const amountInWords = `${formatCurrency(totalAmount)} Only`;

  return (
    <div className="invoice-print-only w-full bg-white p-0 text-slate-900">
      <div className="invoice-print-page w-full border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-3">
            <img src={resolvePharmacyLogo(settings)} alt="GenPharma logo" className="h-16 w-auto rounded-2xl object-contain" />
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{settings?.pharmacy_name || 'GenPharma'}</h2>
              <p className="text-sm text-slate-600">{settings?.owner_name || 'Owner Name'}</p>
              <p className="text-sm text-slate-600">{[settings?.address_line_1, settings?.address_line_2].filter(Boolean).join(', ')}</p>
              <p className="text-sm text-slate-600">{[settings?.city, settings?.state, settings?.pin_code].filter(Boolean).join(' - ')}</p>
              <p className="text-sm text-slate-600">{settings?.phone_number} • {settings?.email}</p>
              <p className="text-sm text-slate-600">{settings?.website}</p>
            </div>
          </div>
          <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Invoice</p>
            <p>Invoice No: {invoice.invoice_no}</p>
            <p>Invoice Date: {invoice.invoice_date}</p>
            <p>Payment Method: {invoice.payment_method}</p>
            <p>Payment Status: {invoice.payment_status}</p>
            <p>GSTIN: {settings?.gstin}</p>
            <p>Drug License: {settings?.drug_license_number}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Bill To</p>
            <p className="mt-2 text-sm text-slate-700">{invoice.customer?.customer_name || 'Walk-in Customer'}</p>
            <p className="text-sm text-slate-600">{invoice.customer?.phone || '—'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Invoice Summary</p>
            <p className="mt-2 text-sm text-slate-700">Currency: {settings?.currency || 'INR'}</p>
            <p className="text-sm text-slate-700">Timezone: {settings?.timezone || 'Asia/Kolkata'}</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Medicine</th>
                <th className="px-4 py-3 text-left">Batch</th>
                <th className="px-4 py-3 text-left">Expiry</th>
                <th className="px-4 py-3 text-left">Qty</th>
                <th className="px-4 py-3 text-left">Unit Price</th>
                <th className="px-4 py-3 text-left">GST %</th>
                <th className="px-4 py-3 text-left">GST Amt</th>
                <th className="px-4 py-3 text-left">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.medicine_name}-${index}`} className="border-t border-slate-200">
                  <td className="px-4 py-3">{row.medicine_name}</td>
                  <td className="px-4 py-3">{row.batch_no}</td>
                  <td className="px-4 py-3">{row.expiry_date}</td>
                  <td className="px-4 py-3">{row.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(row.unit_price)}</td>
                  <td className="px-4 py-3">{row.gst_percent}%</td>
                  <td className="px-4 py-3">{formatCurrency(row.gst_amount)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:justify-end">
          <div className="min-w-[300px] rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="mt-2 flex items-center justify-between"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>
            <div className="mt-2 flex items-center justify-between"><span>GST</span><span>{formatCurrency(gstAmount)}</span></div>
            <div className="mt-2 flex items-center justify-between font-semibold text-slate-900"><span>Grand Total</span><span>{formatCurrency(totalAmount)}</span></div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Amount in Words</p>
          <p className="mt-2">{amountInWords}</p>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-6">
          <div>
            <p className="text-sm font-semibold text-slate-900">Thank You</p>
            <p className="text-sm text-slate-600">{settings?.invoice_footer || 'Thank you for your business.'}</p>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Authorized Signature</p>
            <p className="mt-2">____________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
