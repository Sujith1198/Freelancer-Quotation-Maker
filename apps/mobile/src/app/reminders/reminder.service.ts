import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Customer } from '../customers/customer.model';
import { Invoice } from '../invoices/invoice.model';
import { PaymentService } from '../payments/payment.service';
import { Quotation } from '../quotations/quotation.model';
import { FollowUpReminder, ReminderStatus } from './reminder.model';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly storageKey = 'quoteswift.reminders.v1';

  list(): FollowUpReminder[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.storageKey) ?? '[]',
      ) as FollowUpReminder[];
    } catch {
      return [];
    }
  }

  status(reminder: FollowUpReminder): ReminderStatus {
    if (reminder.completedAt) return 'Completed';
    return new Date(reminder.scheduledAt).getTime() < Date.now()
      ? 'Overdue'
      : 'Upcoming';
  }

  ensureSmartReminders(
    quotes: Quotation[],
    invoices: Invoice[],
    customers: Customer[],
    payments: PaymentService,
  ): FollowUpReminder[] {
    const now = new Date().toISOString();
    const existing = this.list().map((reminder) => {
      const resolved =
        reminder.sourceType === 'Quotation'
          ? quotes.find((quote) => quote.id === reminder.sourceId)?.status !==
            'Sent'
          : payments.get(
              invoices.find((invoice) => invoice.id === reminder.sourceId)
                ?.quotationId ?? '',
            ).status === 'Paid';
      return resolved && !reminder.completedAt
        ? { ...reminder, completedAt: now, updatedAt: now }
        : reminder;
    });
    const additions: FollowUpReminder[] = [];
    for (const quote of quotes.filter((item) => item.status === 'Sent')) {
      if (
        existing.some(
          (item) =>
            item.sourceType === 'Quotation' && item.sourceId === quote.id,
        )
      )
        continue;
      const customer = customers.find((item) => item.id === quote.customerId);
      additions.push(this.fromQuotation(quote, customer));
    }
    for (const invoice of invoices) {
      const payment = payments.get(invoice.quotationId);
      if (
        payment.status === 'Paid' ||
        existing.some(
          (item) =>
            item.sourceType === 'Invoice' && item.sourceId === invoice.id,
        )
      )
        continue;
      const customer = customers.find((item) => item.id === invoice.customerId);
      additions.push(this.fromInvoice(invoice, customer, payment.amountPaid));
    }
    this.persist([...additions, ...existing]);
    return [...additions, ...existing];
  }

  async schedule(reminder: FollowUpReminder): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') return false;
    const at = new Date(reminder.scheduledAt);
    if (at.getTime() <= Date.now()) at.setMinutes(at.getMinutes() + 1);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: this.notificationId(reminder.id),
          title: `${reminder.sourceType} follow-up`,
          body: `${reminder.customerName} · ${reminder.documentNumber}`,
          schedule: { at },
          extra: { reminderId: reminder.id, sourceId: reminder.sourceId },
        },
      ],
    });
    return true;
  }

  complete(id: string): FollowUpReminder[] {
    const now = new Date().toISOString();
    const updated = this.list().map((item) =>
      item.id === id ? { ...item, completedAt: now, updatedAt: now } : item,
    );
    this.persist(updated);
    return updated;
  }

  reopen(id: string): FollowUpReminder[] {
    const now = new Date().toISOString();
    const updated = this.list().map((item) =>
      item.id === id
        ? {
            ...item,
            completedAt: '',
            scheduledAt: this.tomorrow(),
            updatedAt: now,
          }
        : item,
    );
    this.persist(updated);
    return updated;
  }

  whatsappUrl(reminder: FollowUpReminder): string {
    let phone = reminder.customerPhone.replace(/\D/g, '');
    if (phone.length === 10) phone = `91${phone}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(reminder.message)}`;
  }

  callUrl(reminder: FollowUpReminder): string {
    return `tel:${reminder.customerPhone.replace(/[^+\d]/g, '')}`;
  }

  private fromQuotation(
    quote: Quotation,
    customer?: Customer,
  ): FollowUpReminder {
    const now = new Date().toISOString();
    return {
      id: `REM-Q-${quote.id}`,
      sourceType: 'Quotation',
      sourceId: quote.id,
      documentNumber: quote.number,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerPhone: customer?.phone ?? '',
      amount: quote.grandTotal,
      message: `Hi ${quote.customerName}, just following up on quotation ${quote.number} for Rs. ${quote.grandTotal.toLocaleString('en-IN')}. It is valid until ${quote.validUntil}. Please let me know if you have any questions.`,
      scheduledAt: this.beforeDate(quote.validUntil),
      completedAt: '',
      createdAt: now,
      updatedAt: now,
    };
  }

  private fromInvoice(
    invoice: Invoice,
    customer: Customer | undefined,
    paid: number,
  ): FollowUpReminder {
    const now = new Date().toISOString();
    const balance = Math.max(invoice.grandTotal - paid, 0);
    return {
      id: `REM-I-${invoice.id}`,
      sourceType: 'Invoice',
      sourceId: invoice.id,
      documentNumber: invoice.number,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerPhone: customer?.phone ?? '',
      amount: balance,
      message: `Hi ${invoice.customerName}, this is a friendly reminder that Rs. ${balance.toLocaleString('en-IN')} is pending on invoice ${invoice.number}, due ${invoice.dueDate}. Please share the payment reference once paid. Thank you.`,
      scheduledAt: this.beforeDate(invoice.dueDate),
      completedAt: '',
      createdAt: now,
      updatedAt: now,
    };
  }

  private beforeDate(value: string): string {
    const target = new Date(`${value}T10:00:00`);
    target.setDate(target.getDate() - 1);
    return target.getTime() > Date.now()
      ? target.toISOString()
      : this.tomorrow();
  }

  private tomorrow(): string {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  private notificationId(id: string): number {
    return (
      Math.abs(
        [...id].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0),
      ) || 1
    );
  }

  private persist(items: FollowUpReminder[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
