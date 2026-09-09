import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  cloudUploadOutline,
  downloadOutline,
  informationCircleOutline,
  lockClosedOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  trashOutline,
} from 'ionicons/icons';
import { AuthService } from '../auth/auth.service';
import { DataManagementService } from './data-management.service';

@Component({
  selector: 'qs-settings-page',
  standalone: true,
  imports: [IonButton, IonContent, IonIcon, RouterLink],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  private readonly data = inject(DataManagementService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly message = signal('');
  readonly error = signal(false);
  constructor() {
    addIcons({
      arrowBack,
      cloudUploadOutline,
      downloadOutline,
      informationCircleOutline,
      lockClosedOutline,
      refreshOutline,
      shieldCheckmarkOutline,
      trashOutline,
    });
  }
  export(): void {
    this.data.exportBackup();
    this.show('Backup download started.');
  }
  async import(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const count = await this.data.importBackup(file);
      this.show(`${count} data sections restored successfully.`);
    } catch (error) {
      this.show(
        error instanceof Error ? error.message : 'Import failed.',
        true,
      );
    } finally {
      input.value = '';
    }
  }
  clearBusiness(): void {
    if (
      !confirm(
        'Delete all customers, quotes, invoices and business data from this device?',
      )
    )
      return;
    this.data.deleteBusinessData();
    this.show('Business data deleted from this device.');
  }
  async deleteAccount(): Promise<void> {
    if (
      !confirm(
        'Delete this local account and every QuoteSwift record on this device? This cannot be undone.',
      )
    )
      return;
    this.data.deleteEverything();
    this.auth.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
  restartOnboarding(): void {
    localStorage.removeItem('quoteswift.onboarding.v1');
    void this.router.navigateByUrl('/onboarding');
  }
  private show(value: string, isError = false): void {
    this.error.set(isError);
    this.message.set(value);
  }
}
