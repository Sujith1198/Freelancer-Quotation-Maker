import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  chevronForward,
  documentTextOutline,
  receiptOutline,
} from 'ionicons/icons';
import { PaymentService } from '../payments/payment.service';
import { Invoice } from './invoice.model';
import { InvoiceService } from './invoice.service';

@Component({
  selector: 'qs-invoice-list-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, IonContent, IonIcon],
  templateUrl: './invoice-list.page.html',
  styleUrl: './invoice-list.page.scss',
})
export class InvoiceListPage {
  private readonly invoices = inject(InvoiceService);
  private readonly payments = inject(PaymentService);
  readonly items = signal<Invoice[]>(this.invoices.list());

  constructor() {
    addIcons({
      arrowBack,
      chevronForward,
      documentTextOutline,
      receiptOutline,
    });
  }

  paymentStatus(invoice: Invoice): string {
    return this.payments.get(invoice.quotationId).status;
  }
}
