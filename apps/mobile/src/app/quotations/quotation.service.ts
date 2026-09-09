import { Injectable } from '@angular/core';
import {
  Quotation,
  QuotationDraft,
  QuotationLineItem,
} from './quotation.model';

@Injectable({ providedIn: 'root' })
export class QuotationService {
  private readonly storageKey = 'quoteswift.quotations.v1';
  list(): Quotation[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.storageKey) ?? '[]',
      ) as Quotation[];
    } catch {
      return [];
    }
  }
  find(id: string): Quotation | undefined {
    return this.list().find((quote) => quote.id === id);
  }
  save(draft: QuotationDraft, id?: string): Quotation {
    const quotes = this.list();
    const now = new Date().toISOString();
    const existing = id ? quotes.find((quote) => quote.id === id) : undefined;
    const quote: Quotation = {
      ...draft,
      id: existing?.id ?? `QUO-${Date.now().toString(36).toUpperCase()}`,
      number: existing?.number ?? this.nextNumber(quotes),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(
        existing
          ? quotes.map((item) => (item.id === id ? quote : item))
          : [quote, ...quotes],
      ),
    );
    return quote;
  }
  delete(id: string): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.list().filter((quote) => quote.id !== id)),
    );
  }
  updateStatus(id: string, status: Quotation['status']): Quotation | undefined {
    const quotes = this.list();
    const existing = quotes.find((quote) => quote.id === id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(
        quotes.map((quote) => (quote.id === id ? updated : quote)),
      ),
    );
    return updated;
  }
  duplicate(id: string): Quotation | undefined {
    const source = this.find(id);
    if (!source) return undefined;
    const draft: QuotationDraft = {
      customerId: source.customerId,
      customerName: source.customerName,
      customerBusiness: source.customerBusiness,
      status: 'Draft',
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 15 * 86400000)
        .toISOString()
        .slice(0, 10),
      items: source.items.map((item, index) => ({
        ...item,
        id: `LIN-${Date.now()}-${index}`,
      })),
      discountRate: source.discountRate,
      subtotal: source.subtotal,
      discountAmount: source.discountAmount,
      taxableAmount: source.taxableAmount,
      taxAmount: source.taxAmount,
      grandTotal: source.grandTotal,
      notes: source.notes,
      terms: source.terms,
    };
    return this.save(draft);
  }
  calculate(
    items: Pick<QuotationLineItem, 'quantity' | 'rate' | 'taxRate'>[],
    discountRate: number,
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
      0,
    );
    const discountAmount =
      (subtotal * Math.min(Math.max(Number(discountRate || 0), 0), 100)) / 100;
    const ratio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 0;
    const taxAmount = items.reduce(
      (sum, item) =>
        sum +
        (Number(item.quantity || 0) *
          Number(item.rate || 0) *
          ratio *
          Number(item.taxRate || 0)) /
          100,
      0,
    );
    const taxableAmount = subtotal - discountAmount;
    return {
      subtotal: this.round(subtotal),
      discountAmount: this.round(discountAmount),
      taxableAmount: this.round(taxableAmount),
      taxAmount: this.round(taxAmount),
      grandTotal: this.round(taxableAmount + taxAmount),
    };
  }
  private nextNumber(quotes: Quotation[]): string {
    const year = new Date().getFullYear();
    const max = quotes
      .filter((q) => q.number.startsWith(`QT-${year}-`))
      .reduce(
        (value, q) => Math.max(value, Number(q.number.split('-').pop()) || 0),
        0,
      );
    return `QT-${year}-${String(max + 1).padStart(3, '0')}`;
  }
  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
