import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  checkmarkCircle,
  cloudDownloadOutline,
  cloudDoneOutline,
  cloudUploadOutline,
  linkOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  unlinkOutline,
} from 'ionicons/icons';
import { CloudSyncService } from './cloud-sync.service';

@Component({
  selector: 'qs-cloud-sync-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonSpinner,
    RouterLink,
  ],
  templateUrl: './cloud-sync.page.html',
  styleUrl: './cloud-sync.page.scss',
})
export class CloudSyncPage {
  readonly sync = inject(CloudSyncService);
  apiUrl = '';
  email = '';
  password = '';
  constructor() {
    addIcons({
      arrowBack,
      checkmarkCircle,
      cloudDownloadOutline,
      cloudDoneOutline,
      cloudUploadOutline,
      linkOutline,
      refreshOutline,
      shieldCheckmarkOutline,
      unlinkOutline,
    });
  }
  async connect(): Promise<void> {
    if (!this.apiUrl || !this.email || !this.password) return;
    try {
      await this.sync.connect(this.apiUrl, this.email, this.password);
      this.password = '';
    } catch {
      /* service exposes safe error */
    }
  }
  async push(): Promise<void> {
    try {
      await this.sync.push();
    } catch {
      /* shown inline */
    }
  }
  async pull(): Promise<void> {
    if (
      !confirm(
        'Replace this device business data with the latest cloud backup?',
      )
    )
      return;
    try {
      await this.sync.pull();
    } catch {
      /* shown inline */
    }
  }
  async verify(): Promise<void> {
    try {
      await this.sync.verify();
    } catch {
      /* shown inline */
    }
  }
}
