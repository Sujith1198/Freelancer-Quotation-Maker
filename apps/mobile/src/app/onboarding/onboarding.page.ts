import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowForward,
  cloudDoneOutline,
  documentTextOutline,
  flash,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
@Component({
  selector: 'qs-onboarding-page',
  standalone: true,
  imports: [IonButton, IonContent, IonIcon],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
  private readonly router = inject(Router);
  readonly step = signal(0);
  readonly slides = [
    {
      icon: 'document-text-outline',
      kicker: 'CREATE FASTER',
      title: 'Professional quotes in minutes',
      text: 'Save customers and products once, then create polished GST-ready quotations without repetitive typing.',
    },
    {
      icon: 'cloud-done-outline',
      kicker: 'WORK ANYWHERE',
      title: 'Offline first. Cloud ready.',
      text: 'Keep working without internet and back up your business safely whenever your secure API is connected.',
    },
    {
      icon: 'shield-checkmark-outline',
      kicker: 'STAY IN CONTROL',
      title: 'Your business data belongs to you',
      text: 'Export a portable backup, restore it on another device, or delete your local data whenever you choose.',
    },
  ];
  constructor() {
    addIcons({
      arrowForward,
      cloudDoneOutline,
      documentTextOutline,
      flash,
      shieldCheckmarkOutline,
    });
  }
  next(): void {
    if (this.step() < this.slides.length - 1) this.step.update((v) => v + 1);
    else void this.finish();
  }
  async finish(): Promise<void> {
    localStorage.setItem('quoteswift.onboarding.v1', 'done');
    await this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
