import { CurrencyPipe, TitleCasePipe } from '@angular/common';
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
  briefcaseOutline,
  chevronForward,
  cubeOutline,
  searchOutline,
  trashOutline,
} from 'ionicons/icons';
import { CatalogItem, CatalogItemType } from './catalog-item.model';
import { CatalogService } from './catalog.service';

type CatalogFilter = 'all' | CatalogItemType;
@Component({
  selector: 'qs-catalog-list-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    TitleCasePipe,
    RouterLink,
    IonContent,
    IonIcon,
    IonRippleEffect,
  ],
  templateUrl: './catalog-list.page.html',
  styleUrl: './catalog-list.page.scss',
})
export class CatalogListPage implements OnInit {
  private readonly service = inject(CatalogService);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  readonly items = signal<CatalogItem[]>([]);
  readonly query = signal('');
  readonly filter = signal<CatalogFilter>('all');
  readonly filteredItems = computed(() => {
    const term = this.query().trim().toLowerCase();
    return this.items().filter(
      (item) =>
        (this.filter() === 'all' || item.type === this.filter()) &&
        (!term ||
          [item.name, item.code, item.hsnSac].some((value) =>
            value.toLowerCase().includes(term),
          )),
    );
  });
  readonly productCount = computed(
    () => this.items().filter((item) => item.type === 'product').length,
  );
  readonly serviceCount = computed(
    () => this.items().filter((item) => item.type === 'service').length,
  );
  constructor() {
    addIcons({
      add,
      arrowBack,
      briefcaseOutline,
      chevronForward,
      cubeOutline,
      searchOutline,
      trashOutline,
    });
  }
  ngOnInit(): void {
    this.items.set(this.service.list());
  }
  updateSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
  setFilter(filter: CatalogFilter): void {
    this.filter.set(filter);
  }
  async confirmDelete(item: CatalogItem, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const alert = await this.alerts.create({
      header: 'Delete item?',
      message: `${item.name} will be removed from your catalogue.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.remove(item.id),
        },
      ],
    });
    await alert.present();
  }
  private async remove(id: string): Promise<void> {
    this.service.delete(id);
    this.items.set(this.service.list());
    const toast = await this.toasts.create({
      message: 'Catalogue item deleted',
      duration: 1400,
      position: 'bottom',
    });
    await toast.present();
  }
}
