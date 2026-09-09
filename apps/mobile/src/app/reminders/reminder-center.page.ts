import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alarmOutline,
  arrowBack,
  callOutline,
  checkmarkCircleOutline,
  documentTextOutline,
  logoWhatsapp,
  refreshOutline,
  timeOutline,
} from 'ionicons/icons';
import { CustomerService } from '../customers/customer.service';
import { InvoiceService } from '../invoices/invoice.service';
import { PaymentService } from '../payments/payment.service';
import { QuotationService } from '../quotations/quotation.service';
import { FollowUpReminder, ReminderStatus } from './reminder.model';
import { ReminderService } from './reminder.service';

@Component({
  selector: 'qs-reminder-center-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    UpperCasePipe,
    RouterLink,
    IonContent,
    IonIcon,
  ],
  templateUrl: './reminder-center.page.html',
  styleUrl: './reminder-center.page.scss',
})
export class ReminderCenterPage {
  private readonly reminders = inject(ReminderService);
  private readonly payments = inject(PaymentService);
  private readonly toasts = inject(ToastController);
  readonly filter = signal<'All' | ReminderStatus>('All');
  readonly items = signal<FollowUpReminder[]>(
    this.reminders.ensureSmartReminders(
      inject(QuotationService).list(),
      inject(InvoiceService).list(),
      inject(CustomerService).list(),
      this.payments,
    ),
  );

  constructor() {
    addIcons({
      alarmOutline,
      arrowBack,
      callOutline,
      checkmarkCircleOutline,
      documentTextOutline,
      logoWhatsapp,
      refreshOutline,
      timeOutline,
    });
  }

  get visibleItems(): FollowUpReminder[] {
    return this.items().filter(
      (item) => this.filter() === 'All' || this.status(item) === this.filter(),
    );
  }

  get activeCount(): number {
    return this.items().filter((item) => this.status(item) !== 'Completed')
      .length;
  }

  status(item: FollowUpReminder): ReminderStatus {
    return this.reminders.status(item);
  }

  documentLink(item: FollowUpReminder): string[] {
    return item.sourceType === 'Invoice'
      ? ['/invoices', item.sourceId]
      : ['/quotations', item.sourceId];
  }

  async schedule(item: FollowUpReminder): Promise<void> {
    const native = await this.reminders.schedule(item);
    await this.notice(
      native
        ? 'Phone notification scheduled'
        : 'Reminder saved. Native notification works in Android/iOS app.',
    );
  }

  openWhatsApp(item: FollowUpReminder): void {
    window.open(this.reminders.whatsappUrl(item), '_blank', 'noopener');
  }

  call(item: FollowUpReminder): void {
    window.location.href = this.reminders.callUrl(item);
  }

  complete(item: FollowUpReminder): void {
    this.items.set(this.reminders.complete(item.id));
  }

  reopen(item: FollowUpReminder): void {
    this.items.set(this.reminders.reopen(item.id));
  }

  private async notice(message: string): Promise<void> {
    const toast = await this.toasts.create({
      message,
      duration: 1800,
      position: 'bottom',
    });
    await toast.present();
  }
}
