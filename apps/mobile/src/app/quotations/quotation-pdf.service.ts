import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { BusinessProfile } from '../business-profile/business-profile.model';
import { Customer } from '../customers/customer.model';
import { PaymentRecord } from '../payments/payment.model';
import { Quotation } from './quotation.model';

export type PdfTemplate = 'modern' | 'classic';

@Injectable({ providedIn: 'root' })
export class QuotationPdfService {
  async download(
    quote: Quotation,
    business: BusinessProfile,
    customer: Customer | undefined,
    template: PdfTemplate,
    payment?: PaymentRecord,
  ): Promise<void> {
    const pdf = await this.create(quote, business, customer, template, payment);
    pdf.save(this.fileName(quote));
  }

  async print(
    quote: Quotation,
    business: BusinessProfile,
    customer: Customer | undefined,
    template: PdfTemplate,
    payment?: PaymentRecord,
  ): Promise<void> {
    const pdf = await this.create(quote, business, customer, template, payment);
    const url = URL.createObjectURL(pdf.output('blob'));
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.opacity = '0';
    frame.src = url;
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        frame.remove();
      }, 30_000);
    };
    document.body.appendChild(frame);
  }

  async share(
    quote: Quotation,
    business: BusinessProfile,
    customer: Customer | undefined,
    template: PdfTemplate,
    payment?: PaymentRecord,
  ): Promise<'shared' | 'downloaded'> {
    const pdf = await this.create(quote, business, customer, template, payment);
    const fileName = this.fileName(quote);

    if (Capacitor.isNativePlatform()) {
      const base64 = pdf.output('datauristring').split(',')[1];
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({
        title: `Quotation ${quote.number}`,
        text: `${business.businessName || 'QuoteSwift'} quotation for ${quote.customerName}`,
        url: saved.uri,
        dialogTitle: 'Share quotation PDF',
      });
      return 'shared';
    }

    const file = new File([pdf.output('blob')], fileName, {
      type: 'application/pdf',
    });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `Quotation ${quote.number}`,
        text: `Quotation for ${quote.customerName}`,
        files: [file],
      });
      return 'shared';
    }

    pdf.save(fileName);
    return 'downloaded';
  }

  async create(
    quote: Quotation,
    business: BusinessProfile,
    customer: Customer | undefined,
    template: PdfTemplate = 'modern',
    payment?: PaymentRecord,
  ): Promise<jsPDF> {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const modern = template === 'modern';
    const accent: [number, number, number] = modern
      ? [49, 95, 220]
      : [33, 43, 54];
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

    if (modern) {
      pdf.setFillColor(...accent);
      pdf.rect(0, 0, 210, 8, 'F');
    }

    if (business.logoDataUrl) {
      try {
        const format = business.logoDataUrl.includes('image/png')
          ? 'PNG'
          : 'JPEG';
        pdf.addImage(
          business.logoDataUrl,
          format,
          16,
          17,
          20,
          20,
          undefined,
          'FAST',
        );
      } catch {
        this.brandMark(pdf, business, accent);
      }
    } else {
      this.brandMark(pdf, business, accent);
    }

    pdf.setTextColor(...ink);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(business.businessName || 'Your Business', 41, 23);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...muted);
    pdf.setFontSize(8.5);
    const businessLines = [
      [business.addressLine, business.city, business.state, business.postalCode]
        .filter(Boolean)
        .join(', '),
      [business.phone, business.email].filter(Boolean).join('  |  '),
      business.gstin ? `GSTIN: ${business.gstin}` : '',
    ].filter(Boolean);
    pdf.text(businessLines, 41, 28, { lineHeightFactor: 1.35 });

    pdf.setTextColor(...accent);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('QUOTATION', 194, 22, { align: 'right' });
    pdf.setTextColor(...muted);
    pdf.setFontSize(9);
    pdf.text(quote.number, 194, 28, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Status: ${quote.status}`, 194, 33, { align: 'right' });

    pdf.setDrawColor(
      modern ? 214 : 180,
      modern ? 224 : 180,
      modern ? 250 : 180,
    );
    pdf.line(16, 44, 194, 44);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...accent);
    pdf.text('QUOTATION TO', 16, 53);
    pdf.setTextColor(...ink);
    pdf.setFontSize(11);
    pdf.text(quote.customerName, 16, 60);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...muted);
    pdf.setFontSize(8.5);
    const customerLines = [
      quote.customerBusiness,
      customer
        ? [customer.address, customer.city, customer.state, customer.postalCode]
            .filter(Boolean)
            .join(', ')
        : '',
      customer
        ? [customer.phone, customer.email].filter(Boolean).join('  |  ')
        : '',
      customer?.gstin ? `GSTIN: ${customer.gstin}` : '',
    ].filter(Boolean);
    pdf.text(customerLines, 16, 65, { lineHeightFactor: 1.4 });

    pdf.setFontSize(8.5);
    pdf.text('Issue date', 146, 53);
    pdf.text('Valid until', 146, 61);
    pdf.setTextColor(...ink);
    pdf.setFont('helvetica', 'bold');
    pdf.text(date(quote.issueDate), 194, 53, { align: 'right' });
    pdf.text(date(quote.validUntil), 194, 61, { align: 'right' });

    autoTable(pdf, {
      startY: Math.max(84, 66 + customerLines.length * 4),
      margin: { left: 16, right: 16, bottom: 26 },
      head: [['#', 'ITEM & DESCRIPTION', 'QTY', 'RATE', 'GST', 'AMOUNT']],
      body: quote.items.map((item, index) => [
        String(index + 1),
        item.description ? `${item.name}\n${item.description}` : item.name,
        `${item.quantity} ${item.unit}`,
        money(item.rate),
        `${item.taxRate}%`,
        money(item.amount),
      ]),
      theme: modern ? 'striped' : 'grid',
      headStyles: {
        fillColor: accent,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 3,
      },
      bodyStyles: {
        textColor: ink,
        fontSize: 8,
        cellPadding: 3,
        lineColor: [226, 230, 238],
        lineWidth: modern ? 0 : 0.15,
      },
      alternateRowStyles: {
        fillColor: modern ? [245, 248, 255] : [249, 249, 249],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 71 },
        2: { cellWidth: 23, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 16, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
    });

    const tableEnd = (pdf as jsPDF & { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY;
    let y = tableEnd + 8;
    let leftY = tableEnd + 8;
    if (y > 218) {
      pdf.addPage();
      y = 20;
      leftY = 20;
    }
    const totalsX = 125;
    const totalRows: [string, string][] = [
      ['Subtotal', money(quote.subtotal)],
      ...(quote.discountAmount
        ? ([
            [
              `Discount (${quote.discountRate}%)`,
              `-${money(quote.discountAmount)}`,
            ],
          ] as [string, string][])
        : []),
      ['GST', money(quote.taxAmount)],
    ];
    pdf.setFontSize(8.5);
    totalRows.forEach(([label, value]) => {
      pdf.setTextColor(...muted);
      pdf.setFont('helvetica', 'normal');
      pdf.text(label, totalsX, y);
      pdf.setTextColor(...ink);
      pdf.setFont('helvetica', 'bold');
      pdf.text(value, 194, y, { align: 'right' });
      y += 7;
    });
    pdf.setFillColor(...accent);
    pdf.roundedRect(totalsX - 4, y - 2, 73, 13, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('TOTAL', totalsX, y + 6);
    pdf.setFontSize(12);
    pdf.text(money(quote.grandTotal), 194, y + 6, { align: 'right' });

    pdf.setFontSize(7.5);
    if (quote.notes) {
      pdf.setTextColor(...accent);
      pdf.text('NOTES', 16, leftY);
      pdf.setTextColor(...muted);
      pdf.setFont('helvetica', 'normal');
      pdf.text(pdf.splitTextToSize(quote.notes, 92), 16, leftY + 5);
      leftY += 14;
    }
    if (quote.terms) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...accent);
      pdf.text('TERMS & CONDITIONS', 16, leftY);
      pdf.setTextColor(...muted);
      pdf.setFont('helvetica', 'normal');
      pdf.text(pdf.splitTextToSize(quote.terms, 92), 16, leftY + 5);
    }

    let paymentY = Math.max(y + 20, leftY + 18);
    if (
      paymentY > 254 &&
      (business.upiId || business.bankName || payment?.status !== 'Unpaid')
    ) {
      pdf.addPage();
      paymentY = 24;
    }
    if (business.upiId || business.bankName || payment?.status !== 'Unpaid') {
      pdf.setDrawColor(222, 226, 234);
      pdf.line(16, paymentY - 5, 194, paymentY - 5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...accent);
      pdf.setFontSize(7.5);
      pdf.text('PAYMENT DETAILS', 16, paymentY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...ink);
      const paymentDetails = [
        business.upiId ? `UPI: ${business.upiId}` : '',
        business.bankName
          ? [
              business.bankName,
              business.accountName,
              business.accountNumber,
              business.ifscCode ? `IFSC: ${business.ifscCode}` : '',
            ]
              .filter(Boolean)
              .join('  |  ')
          : '',
      ].filter(Boolean);
      pdf.text(paymentDetails, 16, paymentY + 5, { lineHeightFactor: 1.4 });
      const amountPaid = payment?.amountPaid ?? 0;
      const balance = Math.max(quote.grandTotal - amountPaid, 0);
      if (payment && payment.status !== 'Unpaid') {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(
          payment.status === 'Paid' ? 35 : 212,
          payment.status === 'Paid' ? 145 : 137,
          payment.status === 'Paid' ? 92 : 30,
        );
        pdf.text(
          `${payment.status.toUpperCase()}  |  Paid ${money(amountPaid)}${payment.transactionReference ? `  |  Ref: ${payment.transactionReference}` : ''}`,
          16,
          paymentY + 17,
        );
      }
      if (business.upiId && balance > 0) {
        const params = new URLSearchParams({
          pa: business.upiId,
          pn: business.businessName || business.ownerName || 'QuoteSwift',
          am: balance.toFixed(2),
          cu: 'INR',
          tn: `Payment for ${quote.number}`,
          tr: quote.number,
        });
        const qr = await QRCode.toDataURL(`upi://pay?${params.toString()}`, {
          width: 420,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
        pdf.addImage(qr, 'PNG', 164, paymentY, 30, 30, undefined, 'FAST');
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...muted);
        pdf.setFontSize(6.5);
        pdf.text(`Scan to pay ${money(balance)}`, 179, paymentY + 34, {
          align: 'center',
        });
      }
    }
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...muted);
      pdf.setFontSize(7.5);
      pdf.text(
        `${business.businessName || 'QuoteSwift'}  |  ${quote.number}`,
        16,
        288,
      );
      pdf.text(`Page ${page} of ${pages}`, 194, 288, { align: 'right' });
    }
    return pdf;
  }

  private brandMark(
    pdf: jsPDF,
    business: BusinessProfile,
    accent: [number, number, number],
  ): void {
    pdf.setFillColor(...accent);
    pdf.roundedRect(16, 17, 20, 20, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text((business.businessName || 'Q').slice(0, 1).toUpperCase(), 26, 30, {
      align: 'center',
    });
  }

  private fileName(quote: Quotation): string {
    return `${quote.number.replace(/[^a-zA-Z0-9_-]/g, '-')}-${quote.customerName
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')}.pdf`;
  }
}
