import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRippleEffect,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  calendarOutline,
  checkmarkCircle,
  copyOutline,
  createOutline,
  documentTextOutline,
  downloadOutline,
  cardOutline,
  checkmarkDoneOutline,
  printOutline,
  qrCodeOutline,
  personOutline,
  shareSocialOutline,
  timeOutline,
} from 'ionicons/icons';
import { BusinessProfileService } from '../business-profile/business-profile.service';
import { CustomerService } from '../customers/customer.service';
import { PaymentRecord } from '../payments/payment.model';
import { PaymentService } from '../payments/payment.service';
import { Quotation, QuotationStatus } from './quotation.model';
import { PdfTemplate, QuotationPdfService } from './quotation-pdf.service';
import { QuotationService } from './quotation.service';

@Component({
  selector: 'qs-quotation-preview-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    IonContent,
    IonIcon,
    IonRippleEffect,
  ],
  templateUrl: './quotation-preview.page.html',
  styleUrl: './quotation-preview.page.scss',
})
export class QuotationPreviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(QuotationService);
  private readonly customers = inject(CustomerService);
  private readonly toasts = inject(ToastController);
  private readonly pdf = inject(QuotationPdfService);
  private readonly payments = inject(PaymentService);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly quote = signal<Quotation | undefined>(this.service.find(this.id));
  readonly pdfTemplate = signal<PdfTemplate>('modern');
  readonly exporting = signal(false);
  readonly payment = signal<PaymentRecord>(this.payments.get(this.id));
  readonly paymentQr = signal('');
  readonly paidAmount = signal(this.payment().amountPaid);
  readonly paymentReference = signal(this.payment().transactionReference);
  readonly business = inject(BusinessProfileService).get();
  readonly customer = this.customers.find(this.quote()?.customerId ?? '');
  readonly statuses: QuotationStatus[] = [
    'Draft',
    'Sent',
    'Accepted',
    'Rejected',
  ];
  constructor() {
    addIcons({
      arrowBack,
      calendarOutline,
      checkmarkCircle,
      copyOutline,
      createOutline,
      documentTextOutline,
      downloadOutline,
      cardOutline,
      checkmarkDoneOutline,
      printOutline,
      qrCodeOutline,
      personOutline,
      shareSocialOutline,
      timeOutline,
    });
    void this.refreshPaymentQr();
  }
  selectTemplate(template: PdfTemplate): void {
    this.pdfTemplate.set(template);
  }
  async downloadPdf(): Promise<void> {
    const quote = this.quote();
    if (!quote || this.exporting()) return;
    this.exporting.set(true);
    try {
      await this.pdf.download(
        quote,
        this.business,
        this.customer,
        this.pdfTemplate(),
        this.payment(),
      );
      await this.notice('PDF downloaded', 'success');
    } catch {
      await this.notice('Could not create PDF', 'danger');
    } finally {
      this.exporting.set(false);
    }
  }
  async printPdf(): Promise<void> {
    const quote = this.quote();
    if (!quote || this.exporting()) return;
    try {
      await this.pdf.print(
        quote,
        this.business,
        this.customer,
        this.pdfTemplate(),
        this.payment(),
      );
    } catch {
      await this.notice('Could not open print preview', 'danger');
    }
  }
  async sharePdf(): Promise<void> {
    const quote = this.quote();
    if (!quote || this.exporting()) return;
    this.exporting.set(true);
    try {
      const result = await this.pdf.share(
        quote,
        this.business,
        this.customer,
        this.pdfTemplate(),
        this.payment(),
      );
      await this.notice(
        result === 'shared'
          ? 'PDF ready to share'
          : 'Sharing is unavailable — PDF downloaded',
        'success',
      );
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        await this.notice('Could not share PDF', 'danger');
      }
    } finally {
      this.exporting.set(false);
    }
  }
  get balanceDue(): number {
    const quote = this.quote();
    return quote ? this.payments.balance(quote, this.payment()) : 0;
  }
  openUpi(): void {
    const quote = this.quote();
    if (!quote || !this.business.upiId || this.balanceDue <= 0) return;
    window.location.href = this.payments.paymentUri(
      quote,
      this.business,
      this.payment(),
    );
  }
  async savePayment(): Promise<void> {
    const quote = this.quote();
    if (!quote) return;
    const record = this.payments.save(
      quote,
      this.paidAmount(),
      this.paymentReference(),
    );
    this.payment.set(record);
    this.paidAmount.set(record.amountPaid);
    await this.refreshPaymentQr();
    await this.notice(`Payment marked ${record.status}`, 'success');
  }
  async resetPayment(): Promise<void> {
    const record = this.payments.reset(this.id);
    this.payment.set(record);
    this.paidAmount.set(0);
    this.paymentReference.set('');
    await this.refreshPaymentQr();
    await this.notice('Payment reset to Unpaid');
  }
  private async refreshPaymentQr(): Promise<void> {
    const quote = this.quote();
    if (!quote) return;
    this.paymentQr.set(
      await this.payments.qrDataUrl(quote, this.business, this.payment()),
    );
  }
  private async notice(message: string, color?: string): Promise<void> {
    const toast = await this.toasts.create({
      message,
      duration: 1600,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
  get expired(): boolean {
    const value = this.quote();
    return Boolean(
      value &&
      value.status !== 'Accepted' &&
      new Date(`${value.validUntil}T23:59:59`).getTime() < Date.now(),
    );
  }
  async setStatus(status: QuotationStatus): Promise<void> {
    const updated = this.service.updateStatus(this.id, status);
    this.quote.set(updated);
    const toast = await this.toasts.create({
      message: `Status changed to ${status}`,
      duration: 1400,
      color: status === 'Accepted' ? 'success' : undefined,
      position: 'bottom',
    });
    await toast.present();
  }
  async duplicate(): Promise<void> {
    const copy = this.service.duplicate(this.id);
    if (!copy) return;
    const toast = await this.toasts.create({
      message: `Duplicated as ${copy.number}`,
      duration: 1500,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
    await this.router.navigate(['/quotations', copy.id, 'edit']);
  }
}
