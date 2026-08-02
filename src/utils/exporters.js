import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { resolvePharmacyLogo } from './logoUtils';

export function exportReportExcel(reportName, rows, columns) {
  const worksheet = XLSX.utils.json_to_sheet(rows.map((row) => {
    const mapped = {};
    columns.forEach((column) => {
      mapped[column.replace(/_/g, ' ')] = row[column] ?? '';
    });
    return mapped;
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, reportName);
  XLSX.writeFile(workbook, `${reportName}.xlsx`);
}

export function exportReportPdf(reportName, rows, columns, settings = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  try {
    doc.addImage(resolvePharmacyLogo(settings), 'JPEG', 40, 20, 50, 30);
  } catch {
    // ignore image load issues and keep the text header
  }
  doc.text(settings?.pharmacy_name || 'GenPharma', 100, 40);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
  doc.text(`Filters: ${reportName}`, 40, 78);

  const tableRows = rows.map((row) => columns.map((column) => row[column] ?? ''));
  autoTable(doc, {
    startY: 100,
    head: [columns.map((column) => column.replace(/_/g, ' '))],
    body: tableRows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  doc.save(`${reportName}.pdf`);
}

export function exportInvoicePdf(invoice, settings = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 40;

  const rows = (invoice?.items || []).map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || 0);
    const lineSubtotal = Number((unitPrice * quantity).toFixed(2));
    const gstPercent = Number(item.gst_percent ?? invoice?.gst_percent ?? 0);
    const gstAmount = Number(((lineSubtotal * gstPercent) / 100).toFixed(2));
    const lineTotal = Number((lineSubtotal + gstAmount).toFixed(2));

    return [
      item.medicine_name || item.inventoryBatch?.medicine?.medicine_name || '—',
      item.batch_no || item.inventoryBatch?.batch_no || '—',
      item.expiry_date || item.inventoryBatch?.expiry_date || '—',
      quantity,
      unitPrice,
      gstPercent,
      lineTotal,
    ];
  });

  try {
    doc.addImage(resolvePharmacyLogo(settings), 'JPEG', margin, y - 10, 60, 40);
  } catch {
    // ignore image load issues and fall back to text-only branding
  }

  doc.setFontSize(18);
  doc.text(settings?.pharmacy_name || 'GenPharma', margin + 72, y);
  y += 20;
  doc.setFontSize(10);
  doc.text([settings?.address_line_1, settings?.address_line_2].filter(Boolean).join(', '), margin, y);
  y += 14;
  doc.text([settings?.city, settings?.state, settings?.pin_code].filter(Boolean).join(' - '), margin, y);
  y += 14;
  doc.text([settings?.phone_number, settings?.email].filter(Boolean).join(' • '), margin, y);
  y += 24;
  doc.setFontSize(12);
  doc.text(`Invoice No: ${invoice?.invoice_no || ''}`, margin, y);
  doc.text(`Date: ${invoice?.invoice_date || ''}`, pageWidth - margin - 120, y);
  y += 20;
  doc.text(`Customer: ${invoice?.customer?.customer_name || 'Walk-in Customer'}`, margin, y);
  y += 24;

  autoTable(doc, {
    startY: y,
    head: [['Medicine Name', 'Batch', 'Expiry', 'Qty', 'Unit Price', 'GST %', 'Line Total']],
    body: rows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42] },
    theme: 'grid',
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      if (currentPage > 1) {
        doc.setFontSize(9);
        doc.text('Continued...', margin, pageHeight - 20);
      }
    },
  });

  const finalY = doc.lastAutoTable.finalY + 18;
  doc.setFontSize(10);
  doc.text(`Subtotal: ${invoice?.subtotal || 0}`, margin, finalY);
  doc.text(`GST: ${invoice?.gst_amount || 0}`, margin + 180, finalY);
  doc.text(`Grand Total: ${invoice?.total_amount || 0}`, margin + 360, finalY);

  doc.setFontSize(10);
  doc.text('Thank you for your business.', margin, Math.min(pageHeight - 40, finalY + 30));
  doc.text('Authorized Signature', pageWidth - margin - 120, Math.min(pageHeight - 40, finalY + 30));

  doc.save(`invoice-${invoice?.invoice_no || 'preview'}.pdf`);
}
