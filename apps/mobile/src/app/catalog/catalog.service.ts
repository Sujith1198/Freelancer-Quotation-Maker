import { Injectable } from '@angular/core';
import { CatalogItem, CatalogItemDraft } from './catalog-item.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly storageKey = 'quoteswift.catalog.v1';

  list(): CatalogItem[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.storageKey) ?? '[]',
      ) as CatalogItem[];
    } catch {
      return [];
    }
  }
  find(id: string): CatalogItem | undefined {
    return this.list().find((item) => item.id === id);
  }
  save(draft: CatalogItemDraft, id?: string): CatalogItem {
    const items = this.list();
    const now = new Date().toISOString();
    const existing = id ? items.find((item) => item.id === id) : undefined;
    const item: CatalogItem = {
      ...draft,
      id: existing?.id ?? `ITM-${Date.now().toString(36).toUpperCase()}`,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(
        existing
          ? items.map((entry) => (entry.id === id ? item : entry))
          : [item, ...items],
      ),
    );
    return item;
  }
  delete(id: string): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.list().filter((item) => item.id !== id)),
    );
  }
}
