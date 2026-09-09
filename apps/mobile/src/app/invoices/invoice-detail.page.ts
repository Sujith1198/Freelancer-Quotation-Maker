import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  checkmarkCircle,
  downloadOutline,
  printOutline,
  receiptOutline,
} from 'ionicons/icons';
import { BusinessProfileService } from '../business-profile/business-profile.service';
import { CustomerService } from '../customers/customer.service';
import { PaymentService } from '../payments/payment.service';
import { InvoicePdfService, InvoicePdfType } from './invoice-pdf.service';
import { InvoiceService } from './invoice.service';

@Component({
  selector: 'qs-invoice-detail-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, IonContent, IonIcon],
  templateUrl: './invoice-detail.page.html',
  styleUrl: './invoice-detail.page.scss',
})
export class InvoiceDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(InvoiceService);
  private readonly profiles = inject(BusinessProfileService);
  private readonly customers = inject(CustomerService);
  private readonly payments = inject(PaymentService);
  private readonly pdf = inject(InvoicePdfService);
  private readonly toasts = inject(ToastController);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly invoice = this.invoiceService.find(this.id);
  readonly business = this.profiles.get();
  readonly customer = this.customers.find(this.invoice?.customerId ?? '');
  readonly payment = this.payments.get(this.invoice?.quotationId ?? '');

  constructor() {
    addIcons({
      arrowBack,
      checkmarkCircle,
      downloadOutline,
      printOutline,
      receiptOutline,
    });
  }

  get balanceDue(): number {
    return Math.max(
      (this.invoice?.grandTotal ?? 0) - this.payment.amountPaid,
      0,
    );
  }

  async download(type: InvoicePdfType): Promise<void> {
    if (!this.invoice) return;
    this.pdf.download(
      this.invoice,
      this.business,
      this.customer,
      this.payment,
      type,
    );
    const toast = await this.toasts.create({
      message: `${type === 'receipt' ? 'Receipt' : 'Invoice'} downloaded`,
      duration: 1400,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
  }

  print(): void {
    if (!this.invoice) return;
    this.pdf.print(this.invoice, this.business, this.customer, this.payment);
  }
}
