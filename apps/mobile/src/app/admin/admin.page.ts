import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  shieldCheckmarkOutline,
  searchOutline,
  logOutOutline,
  cardOutline,
  banOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { AdminService, AdminUser } from './admin.service';
@Component({
  selector: 'qs-admin-page',
  standalone: true,
  imports: [FormsModule, IonButton, IonContent, IonIcon, IonInput, IonSpinner],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss',
})
export class AdminPage {
  readonly admin = inject(AdminService);
  apiUrl = '';
  email = '';
  password = '';
  query = '';
  monthly = 199;
  yearly = 1999;
  constructor() {
    addIcons({
      peopleOutline,
      shieldCheckmarkOutline,
      searchOutline,
      logOutOutline,
      cardOutline,
      banOutline,
      checkmarkCircleOutline,
    });
    if (this.admin.session()) void this.refresh();
  }
  async login() {
    try {
      await this.admin.login(this.apiUrl, this.email, this.password);
      this.syncPrices();
    } catch {
      /*shown*/
    }
  }
  async refresh() {
    try {
      await this.admin.load(this.query);
      this.syncPrices();
    } catch {
      /*shown*/
    }
  }
  async update(
    user: AdminUser,
    status: 'active' | 'disabled',
    plan: 'free' | 'pro',
  ) {
    try {
      await this.admin.updateUser(user, status, plan);
    } catch {
      /*shown*/
    }
  }
  async savePrice() {
    try {
      await this.admin.savePricing(this.monthly, this.yearly);
    } catch {
      /*shown*/
    }
  }
  private syncPrices() {
    const o = this.admin.overview();
    if (o) {
      this.monthly = o.monthlyPrice;
      this.yearly = o.yearlyPrice;
    }
  }
}
