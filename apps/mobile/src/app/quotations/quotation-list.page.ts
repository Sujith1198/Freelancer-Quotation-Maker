import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonIcon,
  IonRippleEffect,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  arrowBack,
  chevronForward,
  documentTextOutline,
  searchOutline,
  trashOutline,
} from 'ionicons/icons';
import { Quotation, QuotationStatus } from './quotation.model';
import { QuotationService } from './quotation.service';

type QuoteFilter = 'all' | QuotationStatus;
@Component({
  selector: 'qs-quotation-list-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    IonContent,
    IonIcon,
    IonRippleEffect,
  ],
  templateUrl: './quotation-list.page.html',
  styleUrl: './quotation-list.page.scss',
})
export class QuotationListPage implements OnInit {
  private readonly service = inject(QuotationService);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  readonly quotes = signal<Quotation[]>([]);
  readonly query = signal('');
  readonly filter = signal<QuoteFilter>('all');
  readonly filtered = computed(() => {
    const term = this.query().toLowerCase().trim();
    return this.quotes().filter(
      (quote) =>
        (this.filter() === 'all' || quote.status === this.filter()) &&
        (!term ||
          [quote.number, quote.customerName, quote.customerBusiness].some(
            (value) => value.toLowerCase().includes(term),
          )),
    );
  });
  readonly totalValue = computed(() =>
    this.quotes().reduce((sum, quote) => sum + quote.grandTotal, 0),
  );
  constructor() {
    addIcons({
      add,
      arrowBack,
      chevronForward,
      documentTextOutline,
      searchOutline,
      trashOutline,
    });
  }
  ngOnInit(): void {
    this.quotes.set(this.service.list());
  }
  setFilter(filter: QuoteFilter): void {
    this.filter.set(filter);
  }
  updateSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
  async confirmDelete(quote: Quotation, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const alert = await this.alerts.create({
      header: 'Delete quotation?',
      message: `${quote.number} will be permanently removed from this device.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.remove(quote.id),
        },
      ],
    });
    await alert.present();
  }
  private async remove(id: string): Promise<void> {
    this.service.delete(id);
    this.quotes.set(this.service.list());
    const toast = await this.toasts.create({
      message: 'Quotation deleted',
      duration: 1400,
      position: 'bottom',
    });
    await toast.present();
  }
}
