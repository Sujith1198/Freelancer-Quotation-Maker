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
  personOutline,
  timeOutline,
} from 'ionicons/icons';
import { BusinessProfileService } from '../business-profile/business-profile.service';
import { CustomerService } from '../customers/customer.service';
import { Quotation, QuotationStatus } from './quotation.model';
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
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly quote = signal<Quotation | undefined>(this.service.find(this.id));
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
      personOutline,
      timeOutline,
    });
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
