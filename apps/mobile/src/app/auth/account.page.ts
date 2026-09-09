import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  businessOutline,
  cloudDoneOutline,
  documentTextOutline,
  logOutOutline,
  peopleOutline,
  receiptOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { CustomerService } from '../customers/customer.service';
import { InvoiceService } from '../invoices/invoice.service';
import { QuotationService } from '../quotations/quotation.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'qs-account-page',
  standalone: true,
  imports: [IonButton, IonContent, IonIcon, RouterLink],
  templateUrl: './account.page.html',
  styleUrl: './account.page.scss',
})
export class AccountPage {
  readonly auth = inject(AuthService);
  private readonly customers = inject(CustomerService);
  private readonly quotes = inject(QuotationService);
  private readonly invoices = inject(InvoiceService);
  private readonly router = inject(Router);

  readonly counts = {
    customers: this.customers.list().length,
    quotations: this.quotes.list().length,
    invoices: this.invoices.list().length,
  };

  constructor() {
    addIcons({
      arrowBack,
      businessOutline,
      cloudDoneOutline,
      documentTextOutline,
      logOutOutline,
      peopleOutline,
      receiptOutline,
      shieldCheckmarkOutline,
    });
  }

  async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
