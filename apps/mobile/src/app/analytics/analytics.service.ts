import { Injectable } from '@angular/core';
import { Invoice } from '../invoices/invoice.model';
import { PaymentRecord } from '../payments/payment.model';
import { Quotation } from '../quotations/quotation.model';
import {
  AnalyticsReport,
  CustomerMetric,
  MonthlyMetric,
  ReportRange,
} from './analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  build(
    quotes: Quotation[],
    invoices: Invoice[],
    payments: PaymentRecord[],
    range: ReportRange,
  ): AnalyticsReport {
    const from = range ? Date.now() - range * 86_400_000 : 0;
    const inRange = (value: string) => new Date(value).getTime() >= from;
    const filteredQuotes = quotes.filter((quote) => inRange(quote.createdAt));
    const filteredInvoices = invoices.filter((invoice) =>
      inRange(invoice.createdAt),
    );
    const invoiceIds = new Set(
      filteredInvoices.map((invoice) => invoice.quotationId),
    );
    const filteredPayments = payments.filter(
      (payment) =>
        invoiceIds.has(payment.quotationId) && payment.amountPaid > 0,
    );
    const sum = (values: number[]) =>
      values.reduce((total, value) => total + Number(value || 0), 0);
    const quotationValue = sum(filteredQuotes.map((quote) => quote.grandTotal));
    const invoicedValue = sum(
      filteredInvoices.map((invoice) => invoice.grandTotal),
    );
    const collectedValue = sum(
      filteredPayments.map((payment) => payment.amountPaid),
    );
    const accepted = filteredQuotes.filter(
      (quote) => quote.status === 'Accepted',
    ).length;
    return {
      quotationValue,
      invoicedValue,
      collectedValue,
      outstandingValue: Math.max(invoicedValue - collectedValue, 0),
      conversionRate: filteredQuotes.length
        ? Math.round((accepted / filteredQuotes.length) * 100)
        : 0,
      averageInvoice: filteredInvoices.length
        ? invoicedValue / filteredInvoices.length
        : 0,
      quoteStatuses: {
        Draft: filteredQuotes.filter((quote) => quote.status === 'Draft')
          .length,
        Sent: filteredQuotes.filter((quote) => quote.status === 'Sent').length,
        Accepted: accepted,
        Rejected: filteredQuotes.filter((quote) => quote.status === 'Rejected')
          .length,
      },
      monthly: this.monthly(filteredInvoices, filteredPayments),
      topCustomers: this.customers(filteredInvoices, filteredPayments),
    };
  }

  exportCsv(report: AnalyticsReport, range: ReportRange): void {
    const rows: (string | number)[][] = [
      ['QuoteSwift Analytics Report'],
      ['Range', range ? `Last ${range} days` : 'All time'],
      ['Generated', new Date().toISOString()],
      [],
      ['Summary', 'Amount'],
      ['Quotation value', report.quotationValue],
      ['Invoiced value', report.invoicedValue],
      ['Collected value', report.collectedValue],
      ['Outstanding value', report.outstandingValue],
      ['Conversion rate', `${report.conversionRate}%`],
      ['Average invoice', report.averageInvoice],
      [],
      ['Month', 'Invoiced', 'Collected'],
      ...report.monthly.map((item) => [
        item.label,
        item.invoiced,
        item.collected,
      ]),
      [],
      ['Customer', 'Invoices', 'Invoiced', 'Collected'],
      ...report.topCustomers.map((item) => [
        item.name,
        item.invoices,
        item.invoiced,
        item.collected,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\r\n');
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `QuoteSwift-Analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private monthly(
    invoices: Invoice[],
    payments: PaymentRecord[],
  ): MonthlyMetric[] {
    const result: MonthlyMetric[] = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - offset);
      const year = date.getFullYear();
      const month = date.getMonth();
      const matching = invoices.filter((invoice) => {
        const created = new Date(invoice.createdAt);
        return created.getFullYear() === year && created.getMonth() === month;
      });
      const ids = new Set(matching.map((invoice) => invoice.quotationId));
      result.push({
        label: date.toLocaleDateString('en-IN', { month: 'short' }),
        invoiced: matching.reduce((sum, item) => sum + item.grandTotal, 0),
        collected: payments
          .filter((payment) => ids.has(payment.quotationId))
          .reduce((sum, payment) => sum + payment.amountPaid, 0),
      });
    }
    return result;
  }

  private customers(
    invoices: Invoice[],
    payments: PaymentRecord[],
  ): CustomerMetric[] {
    const map = new Map<string, CustomerMetric>();
    for (const invoice of invoices) {
      const current = map.get(invoice.customerId) ?? {
        customerId: invoice.customerId,
        name: invoice.customerName,
        invoices: 0,
        invoiced: 0,
        collected: 0,
      };
      current.invoices += 1;
      current.invoiced += invoice.grandTotal;
      current.collected +=
        payments.find((payment) => payment.quotationId === invoice.quotationId)
          ?.amountPaid ?? 0;
      map.set(invoice.customerId, current);
    }
    return [...map.values()]
      .sort((a, b) => b.invoiced - a.invoiced)
      .slice(0, 5);
  }
}
