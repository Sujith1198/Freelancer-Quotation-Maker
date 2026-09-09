import { Injectable } from '@angular/core';
import { Quotation } from '../quotations/quotation.model';
import { Invoice } from './invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly storageKey = 'quoteswift.invoices.v1';

  list(): Invoice[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.storageKey) ?? '[]',
      ) as Invoice[];
    } catch {
      return [];
    }
  }

  find(id: string): Invoice | undefined {
    return this.list().find((invoice) => invoice.id === id);
  }

  findByQuotation(quotationId: string): Invoice | undefined {
    return this.list().find((invoice) => invoice.quotationId === quotationId);
  }

  createFromQuotation(quote: Quotation): Invoice {
    const existing = this.findByQuotation(quote.id);
    if (existing) return existing;
    const invoices = this.list();
    const now = new Date();
    const invoice: Invoice = {
      id: `INV-${Date.now().toString(36).toUpperCase()}`,
      number: this.nextNumber(invoices),
      quotationId: quote.id,
      quotationNumber: quote.number,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerBusiness: quote.customerBusiness,
      issueDate: now.toISOString().slice(0, 10),
      dueDate: new Date(now.getTime() + 15 * 86400000)
        .toISOString()
        .slice(0, 10),
      items: quote.items.map((item) => ({ ...item })),
      discountRate: quote.discountRate,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxableAmount: quote.taxableAmount,
      taxAmount: quote.taxAmount,
      grandTotal: quote.grandTotal,
      notes: quote.notes,
      terms: quote.terms,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    localStorage.setItem(
      this.storageKey,
      JSON.stringify([invoice, ...invoices]),
    );
    return invoice;
  }

  delete(id: string): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.list().filter((invoice) => invoice.id !== id)),
    );
  }

  private nextNumber(invoices: Invoice[]): string {
    const year = new Date().getFullYear();
    const max = invoices
      .filter((invoice) => invoice.number.startsWith(`INV-${year}-`))
      .reduce(
        (value, invoice) =>
          Math.max(value, Number(invoice.number.split('-').pop()) || 0),
        0,
      );
    return `INV-${year}-${String(max + 1).padStart(3, '0')}`;
  }
}
