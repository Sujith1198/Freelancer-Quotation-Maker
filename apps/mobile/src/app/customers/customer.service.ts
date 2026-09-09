import { Injectable } from '@angular/core';
import { Customer, CustomerDraft } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly storageKey = 'quoteswift.customers.v1';

  list(): Customer[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.storageKey) ?? '[]',
      ) as Customer[];
    } catch {
      return [];
    }
  }

  find(id: string): Customer | undefined {
    return this.list().find((customer) => customer.id === id);
  }

  save(draft: CustomerDraft, id?: string): Customer {
    const customers = this.list();
    const now = new Date().toISOString();
    const existing = id
      ? customers.find((customer) => customer.id === id)
      : undefined;
    const customer: Customer = {
      ...draft,
      id: existing?.id ?? this.newId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = existing
      ? customers.map((item) => (item.id === existing.id ? customer : item))
      : [customer, ...customers];
    localStorage.setItem(this.storageKey, JSON.stringify(next));
    return customer;
  }

  delete(id: string): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.list().filter((customer) => customer.id !== id)),
    );
  }

  private newId(): string {
    return `CUS-${Date.now().toString(36).toUpperCase()}`;
  }
}
