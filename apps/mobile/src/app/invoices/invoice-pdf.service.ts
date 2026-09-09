import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BusinessProfile } from '../business-profile/business-profile.model';
import { Customer } from '../customers/customer.model';
import { PaymentRecord } from '../payments/payment.model';
import { Invoice } from './invoice.model';

export type InvoicePdfType = 'invoice' | 'receipt';

@Injectable({ providedIn: 'root' })
export class InvoicePdfService {
  download(
    invoice: Invoice,
    business: BusinessProfile,
    customer: Customer | undefined,
    payment: PaymentRecord,
    type: InvoicePdfType,
  ): void {
    this.create(invoice, business, customer, payment, type).save(
      `${type === 'receipt' ? 'Receipt' : invoice.number}-${invoice.customerName.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`,
    );
  }
  print(
    invoice: Invoice,
    business: BusinessProfile,
    customer: Customer | undefined,
    payment: PaymentRecord,
  ): void {
    const url = URL.createObjectURL(
      this.create(invoice, business, customer, payment).output('blob'),
    );
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.opacity = '0';
    frame.src = url;
    frame.onload = () => {
      frame.contentWindow?.print();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        frame.remove();
      }, 30_000);
    };
    document.body.appendChild(frame);
  }

  create(
    invoice: Invoice,
    business: BusinessProfile,
    customer: Customer | undefined,
    payment: PaymentRecord,
    type: InvoicePdfType = 'invoice',
  ): jsPDF {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const accent: [number, number, number] =
      type === 'receipt' ? [35, 145, 92] : [49, 95, 220];
    const ink: [number, number, number] = [31, 42, 62];
    const muted: [number, number, number] = [105, 116, 138];
    const number = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const money = (value: number) => `Rs. ${number.format(value)}`;
    const date = (value: string) =>
      new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${value}T00:00:00`));

    pdf.setFillColor(...accent);
    pdf.rect(0, 0, 210, 9, 'F');
    pdf.roundedRect(16, 18, 20, 20, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text((business.businessName || 'Q').slice(0, 1).toUpperCase(), 26, 31, {
      align: 'center',
    });
    pdf.setTextColor(...ink);
    pdf.setFontSize(15);
    pdf.text(business.businessName || 'Your Business', 41, 24);
    pdf.setTextColor(...muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(
      [
        [
          business.addressLine,
          business.city,
          business.state,
          business.postalCode,
        ]
          .filter(Boolean)
          .join(', '),
        [business.phone, business.email].filter(Boolean).join(' | '),
        business.gstin ? `GSTIN: ${business.gstin}` : '',
      ].filter(Boolean),
      41,
      29,
    );
    pdf.setTextColor(...accent);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text(type === 'receipt' ? 'PAYMENT RECEIPT' : 'TAX INVOICE', 194, 23, {
      align: 'right',
    });
    pdf.setTextColor(...muted);
    pdf.setFontSize(9);
    pdf.text(invoice.number, 194, 30, { align: 'right' });
    pdf.line(16, 46, 194, 46);

    pdf.setTextColor(...accent);
    pdf.setFontSize(7.5);
    pdf.text('BILL TO', 16, 55);
    pdf.setTextColor(...ink);
    pdf.setFontSize(11);
    pdf.text(invoice.customerName, 16, 62);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...muted);
    pdf.setFontSize(8);
    pdf.text(
      [
        invoice.customerBusiness,
        customer
          ? [
              customer.address,
              customer.city,
              customer.state,
              customer.postalCode,
            ]
              .filter(Boolean)
              .join(', ')
          : '',
        customer?.gstin ? `GSTIN: ${customer.gstin}` : '',
      ].filter(Boolean),
      16,
      67,
    );
    pdf.text(type === 'receipt' ? 'Payment date' : 'Invoice date', 145, 55);
    pdf.text(type === 'receipt' ? 'Reference' : 'Due date', 145, 63);
    pdf.setTextColor(...ink);
    pdf.setFont('helvetica', 'bold');
    pdf.text(
      type === 'receipt' && payment.paidAt
        ? date(payment.paidAt.slice(0, 10))
        : date(invoice.issueDate),
      194,
      55,
      { align: 'right' },
    );
    pdf.text(
      type === 'receipt'
        ? payment.transactionReference || '-'
        : date(invoice.dueDate),
      194,
      63,
      { align: 'right' },
    );

    autoTable(pdf, {
      startY: 85,
      margin: { left: 16, right: 16, bottom: 24 },
      head: [['#', 'ITEM & DESCRIPTION', 'QTY', 'RATE', 'GST', 'AMOUNT']],
      body: invoice.items.map((item, index) => [
        String(index + 1),
        item.description ? `${item.name}\n${item.description}` : item.name,
        `${item.quantity} ${item.unit}`,
        money(item.rate),
        `${item.taxRate}%`,
        money(item.amount),
      ]),
      theme: 'striped',
      headStyles: { fillColor: accent, fontSize: 8, cellPadding: 3 },
      bodyStyles: { textColor: ink, fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 71 },
        2: { cellWidth: 23, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 16, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
    });
    const end = (pdf as jsPDF & { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY;
    let y = end + 10;
    if (y > 230) {
      pdf.addPage();
      y = 24;
    }
    const rows: [string, number][] = [
      ['Subtotal', invoice.subtotal],
      ['Discount', -invoice.discountAmount],
      ['GST', invoice.taxAmount],
      ['Invoice total', invoice.grandTotal],
      ['Amount received', payment.amountPaid],
      ['Balance due', Math.max(invoice.grandTotal - payment.amountPaid, 0)],
    ];
    rows.forEach(([label, value], index) => {
      const final = index === rows.length - 1;
      if (final) {
        pdf.setFillColor(...accent);
        pdf.roundedRect(116, y - 5, 78, 12, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
      } else {
        pdf.setTextColor(...(index >= 4 ? accent : muted));
      }
      pdf.setFont('helvetica', index >= 3 ? 'bold' : 'normal');
      pdf.setFontSize(final ? 10 : 8.5);
      pdf.text(label, 121, y);
      pdf.text(money(value), 190, y, { align: 'right' });
      y += final ? 14 : 7;
    });
    if (type === 'receipt') {
      pdf.setTextColor(...accent);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text('PAYMENT RECEIVED - THANK YOU', 16, Math.min(y, 268));
    }
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...muted);
      pdf.setFontSize(7.5);
      pdf.text(`${invoice.number} | From ${invoice.quotationNumber}`, 16, 288);
      pdf.text(`Page ${page} of ${pages}`, 194, 288, { align: 'right' });
    }
    return pdf;
  }
}
