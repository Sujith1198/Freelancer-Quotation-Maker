import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonRippleEffect,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  barChartOutline,
  chevronForward,
  documentTextOutline,
  ellipsisHorizontal,
  home,
  notificationsOutline,
  peopleOutline,
  settingsOutline,
  timeOutline,
} from 'ionicons/icons';

type QuoteStatus = 'Accepted' | 'Sent' | 'Draft';
interface RecentQuote {
  id: string;
  customer: string;
  createdAt: Date;
  amount: number;
  status: QuoteStatus;
}

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
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  readonly quotes: RecentQuote[] = [
    {
      id: 'QT-2026-014',
      customer: 'Arun Digital Studio',
      createdAt: new Date('2026-09-09'),
      amount: 24500,
      status: 'Accepted',
    },
    {
      id: 'QT-2026-013',
      customer: 'Meera Boutique',
      createdAt: new Date('2026-09-08'),
      amount: 12800,
      status: 'Sent',
    },
    {
      id: 'QT-2026-012',
      customer: 'RK Electricals',
      createdAt: new Date('2026-09-07'),
      amount: 8650,
      status: 'Draft',
    },
  ];

  constructor() {
    addIcons({
      add,
      barChartOutline,
      chevronForward,
      documentTextOutline,
      ellipsisHorizontal,
      home,
      notificationsOutline,
      peopleOutline,
      settingsOutline,
      timeOutline,
    });
  }
}
