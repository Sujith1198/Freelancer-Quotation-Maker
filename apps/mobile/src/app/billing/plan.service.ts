import { Injectable, computed, signal } from '@angular/core';

export type PlanCode = 'free' | 'pro';

export interface Entitlement {
  plan: PlanCode;
  source: 'free' | 'trial' | 'store' | 'admin';
  expiresAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly key = 'quoteswift.entitlement.v1';
  readonly entitlement = signal<Entitlement>(this.read());
  readonly isPro = computed(() => {
    const current = this.entitlement();
    return (
      current.plan === 'pro' &&
      (!current.expiresAt || new Date(current.expiresAt).getTime() > Date.now())
    );
  });
  readonly planName = computed(() =>
    this.isPro() ? 'QuoteSwift Pro' : 'Free',
  );

  readonly limits = { customers: 25, catalog: 20, quotationsPerMonth: 10 };

  startTrial(): void {
    if (localStorage.getItem('quoteswift.trial-used.v1')) return;
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    this.save({
      plan: 'pro',
      source: 'trial',
      expiresAt: expires.toISOString(),
    });
    localStorage.setItem('quoteswift.trial-used.v1', 'true');
  }

  trialAvailable(): boolean {
    return !localStorage.getItem('quoteswift.trial-used.v1');
  }

  remainingDays(): number | null {
    const expiresAt = this.entitlement().expiresAt;
    if (!expiresAt) return null;
    return Math.max(
      Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000),
      0,
    );
  }

  usage(): { customers: number; catalog: number; quotations: number } {
    const month = new Date().toISOString().slice(0, 7);
    return {
      customers: this.count('quoteswift.customers.v1'),
      catalog: this.count('quoteswift.catalog.v1'),
      quotations: this.readArray('quoteswift.quotations.v1').filter((item) =>
        String((item as { createdAt?: string }).createdAt ?? '').startsWith(
          month,
        ),
      ).length,
    };
  }

  private count(key: string): number {
    return this.readArray(key).length;
  }
  private readArray(key: string): unknown[] {
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown;
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
  private save(value: Entitlement): void {
    localStorage.setItem(this.key, JSON.stringify(value));
    this.entitlement.set(value);
  }
  private read(): Entitlement {
    try {
      return JSON.parse(
        localStorage.getItem(this.key) ??
          '{"plan":"free","source":"free","expiresAt":null}',
      ) as Entitlement;
    } catch {
      return { plan: 'free', source: 'free', expiresAt: null };
    }
  }
}
