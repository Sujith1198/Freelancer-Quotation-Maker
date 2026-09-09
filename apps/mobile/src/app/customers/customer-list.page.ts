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
  businessOutline,
  callOutline,
  chevronForward,
  mailOutline,
  peopleOutline,
  searchOutline,
  trashOutline,
} from 'ionicons/icons';
import { Customer } from './customer.model';
import { CustomerService } from './customer.service';

@Component({
  selector: 'qs-customer-list-page',
  standalone: true,
  imports: [RouterLink, IonContent, IonIcon, IonRippleEffect],
  templateUrl: './customer-list.page.html',
  styleUrl: './customer-list.page.scss',
})
export class CustomerListPage implements OnInit {
  private readonly customersService = inject(CustomerService);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  readonly customers = signal<Customer[]>([]);
  readonly query = signal('');
  readonly filteredCustomers = computed(() => {
    const term = this.query().trim().toLowerCase();
    return term
      ? this.customers().filter((customer) =>
          [
            customer.name,
            customer.businessName,
            customer.phone,
            customer.email,
          ].some((value) => value.toLowerCase().includes(term)),
        )
      : this.customers();
  });

  constructor() {
    addIcons({
      add,
      arrowBack,
      businessOutline,
      callOutline,
      chevronForward,
      mailOutline,
      peopleOutline,
      searchOutline,
      trashOutline,
    });
  }
  ngOnInit(): void {
    this.customers.set(this.customersService.list());
  }
  updateSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  async confirmDelete(customer: Customer, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const alert = await this.alerts.create({
      header: 'Delete customer?',
      message: `${customer.name} will be removed from this device.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.remove(customer.id),
        },
      ],
    });
    await alert.present();
  }

  private async remove(id: string): Promise<void> {
    this.customersService.delete(id);
    this.customers.set(this.customersService.list());
    const toast = await this.toasts.create({
      message: 'Customer deleted',
      duration: 1400,
      position: 'bottom',
    });
    await toast.present();
  }
}
