import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  checkmarkCircle,
  cloudDoneOutline,
  documentTextOutline,
  flash,
  peopleOutline,
  ribbonOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { PlanService } from './plan.service';

@Component({
  selector: 'qs-upgrade-page',
  standalone: true,
  imports: [IonButton, IonContent, IonIcon, RouterLink],
  templateUrl: './upgrade.page.html',
  styleUrl: './upgrade.page.scss',
})
export class UpgradePage {
  readonly plans = inject(PlanService);
  readonly started = signal(false);
  readonly usage = this.plans.usage();
  constructor() {
    addIcons({
      arrowBack,
      checkmarkCircle,
      cloudDoneOutline,
      documentTextOutline,
      flash,
      peopleOutline,
      ribbonOutline,
      shieldCheckmarkOutline,
      sparklesOutline,
    });
  }
  startTrial(): void {
    this.plans.startTrial();
    this.started.set(true);
  }
}
