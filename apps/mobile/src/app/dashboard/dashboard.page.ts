import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonRippleEffect,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { BusinessProfile } from '../business-profile/business-profile.model';
import { BusinessProfileService } from '../business-profile/business-profile.service';
import { Quotation } from '../quotations/quotation.model';
import { QuotationService } from '../quotations/quotation.service';
import { PaymentService } from '../payments/payment.service';
import {
  add,
  barChartOutline,
  chevronForward,
  cubeOutline,
  documentTextOutline,
  ellipsisHorizontal,
  home,
  notificationsOutline,
  peopleOutline,
  settingsOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons';

@Component({
  selector: 'qs-dashboard-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    IonButton,
    IonContent,
    IonIcon,
    IonRippleEffect,
    RouterLink,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  private readonly profiles = inject(BusinessProfileService);
  private readonly quotationService = inject(QuotationService);
  private readonly payments = inject(PaymentService);
  readonly businessProfile = signal<BusinessProfile | null>(null);
  readonly quotes = signal<Quotation[]>([]);
  get totalValue(): number {
    return this.quotationService
      .list()
      .reduce((sum, quote) => sum + quote.grandTotal, 0);
  }
  get totalQuotes(): number {
    return this.quotationService.list().length;
  }
  get acceptedQuotes(): number {
    return this.quotationService
      .list()
      .filter((quote) => quote.status === 'Accepted').length;
  }
  get pendingQuotes(): number {
    return this.quotationService
      .list()
      .filter((quote) => quote.status === 'Draft' || quote.status === 'Sent')
      .length;
  }
  get collectedValue(): number {
    return this.payments
      .list()
      .reduce((sum, payment) => sum + payment.amountPaid, 0);
  }
  get outstandingValue(): number {
    return Math.max(this.totalValue - this.collectedValue, 0);
  }

  constructor() {
    addIcons({
      add,
      barChartOutline,
      chevronForward,
      cubeOutline,
      documentTextOutline,
      ellipsisHorizontal,
      home,
      notificationsOutline,
      peopleOutline,
      settingsOutline,
      timeOutline,
      walletOutline,
    });
  }

  ngOnInit(): void {
    const profile = this.profiles.get();
    this.businessProfile.set(profile.businessName ? profile : null);
    this.quotes.set(this.quotationService.list().slice(0, 3));
  }
}
