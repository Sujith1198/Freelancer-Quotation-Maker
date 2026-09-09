import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  arrowDownOutline,
  barChartOutline,
  cashOutline,
  downloadOutline,
  peopleOutline,
  receiptOutline,
  statsChartOutline,
  walletOutline,
} from 'ionicons/icons';
import { InvoiceService } from '../invoices/invoice.service';
import { PaymentService } from '../payments/payment.service';
import { QuotationService } from '../quotations/quotation.service';
import { AnalyticsReport, ReportRange } from './analytics.model';
import { AnalyticsService } from './analytics.service';

@Component({
  selector: 'qs-analytics-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, IonContent, IonIcon],
  templateUrl: './analytics.page.html',
  styleUrl: './analytics.page.scss',
})
export class AnalyticsPage {
  private readonly analytics = inject(AnalyticsService);
  private readonly quotes = inject(QuotationService);
  private readonly invoices = inject(InvoiceService);
  private readonly payments = inject(PaymentService);
  private readonly toasts = inject(ToastController);
  readonly range = signal<ReportRange>(365);
  readonly report = signal<AnalyticsReport>(this.createReport());
  readonly ranges: { label: string; value: ReportRange }[] = [
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
    { label: '1 year', value: 365 },
    { label: 'All time', value: 0 },
  ];

  constructor() {
    addIcons({
      arrowBack,
      arrowDownOutline,
      barChartOutline,
      cashOutline,
      downloadOutline,
      peopleOutline,
      receiptOutline,
      statsChartOutline,
      walletOutline,
    });
  }

  selectRange(value: ReportRange): void {
    this.range.set(value);
    this.report.set(this.createReport());
  }

  monthHeight(value: number): number {
    const max = Math.max(
      ...this.report().monthly.map((item) => item.invoiced),
      1,
    );
    return value ? Math.max((value / max) * 100, 5) : 2;
  }

  statusPercent(count: number): number {
    const total = Object.values(this.report().quoteStatuses).reduce(
      (sum, value) => sum + value,
      0,
    );
    return total ? (count / total) * 100 : 0;
  }

  async export(): Promise<void> {
    this.analytics.exportCsv(this.report(), this.range());
    const toast = await this.toasts.create({
      message: 'Analytics CSV downloaded',
      duration: 1500,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
  }

  private createReport(): AnalyticsReport {
    return this.analytics.build(
      this.quotes.list(),
      this.invoices.list(),
      this.payments.list(),
      this.range(),
    );
  }
}
