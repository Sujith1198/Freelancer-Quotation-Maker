import { Injectable } from '@angular/core';
import QRCode from 'qrcode';
import { BusinessProfile } from '../business-profile/business-profile.model';
import { Quotation } from '../quotations/quotation.model';
import { PaymentRecord } from './payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly storageKey = 'quoteswift.payments.v1';

  list(): PaymentRecord[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.storageKey) ?? '[]',
      ) as PaymentRecord[];
    } catch {
      return [];
    }
  }

  get(quotationId: string): PaymentRecord {
    return (
      this.list().find((item) => item.quotationId === quotationId) ?? {
        quotationId,
        status: 'Unpaid',
        amountPaid: 0,
        transactionReference: '',
        paidAt: '',
        updatedAt: '',
      }
    );
  }

  save(
    quote: Quotation,
    amountPaid: number,
    transactionReference: string,
  ): PaymentRecord {
    const safeAmount = Math.min(
      Math.max(Number(amountPaid || 0), 0),
      quote.grandTotal,
    );
    const now = new Date().toISOString();
    const payment: PaymentRecord = {
      quotationId: quote.id,
      status:
        safeAmount >= quote.grandTotal
          ? 'Paid'
          : safeAmount > 0
            ? 'Partial'
            : 'Unpaid',
      amountPaid: this.round(safeAmount),
      transactionReference: transactionReference.trim(),
      paidAt: safeAmount > 0 ? now : '',
      updatedAt: now,
    };
    const records = this.list().filter((item) => item.quotationId !== quote.id);
    localStorage.setItem(
      this.storageKey,
      JSON.stringify([payment, ...records]),
    );
    return payment;
  }

  reset(quotationId: string): PaymentRecord {
    const records = this.list().filter(
      (item) => item.quotationId !== quotationId,
    );
    localStorage.setItem(this.storageKey, JSON.stringify(records));
    return this.get(quotationId);
  }

  balance(quote: Quotation, payment = this.get(quote.id)): number {
    return this.round(Math.max(quote.grandTotal - payment.amountPaid, 0));
  }

  paymentUri(
    quote: Quotation,
    business: BusinessProfile,
    payment = this.get(quote.id),
  ): string {
    if (!business.upiId) return '';
    const params = new URLSearchParams({
      pa: business.upiId,
      pn: business.businessName || business.ownerName || 'QuoteSwift',
      am: this.balance(quote, payment).toFixed(2),
      cu: 'INR',
      tn: `Payment for ${quote.number}`,
      tr: quote.number,
    });
    return `upi://pay?${params.toString()}`;
  }

  async qrDataUrl(
    quote: Quotation,
    business: BusinessProfile,
    payment = this.get(quote.id),
  ): Promise<string> {
    const uri = this.paymentUri(quote, business, payment);
    if (!uri || this.balance(quote, payment) <= 0) return '';
    return QRCode.toDataURL(uri, {
      width: 520,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#15213b', light: '#ffffff' },
    });
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
