import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DataManagementService {
  private readonly businessKeys = [
    'quoteswift.business-profile.v1',
    'quoteswift.customers.v1',
    'quoteswift.catalog.v1',
    'quoteswift.quotations.v1',
    'quoteswift.payments.v1',
    'quoteswift.invoices.v1',
    'quoteswift.reminders.v1',
  ];

  exportBackup(): void {
    const data: Record<string, unknown> = {};
    for (const key of this.businessKeys) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          data[key] = JSON.parse(raw) as unknown;
        } catch {
          data[key] = raw;
        }
      }
    }
    const backup = {
      app: 'QuoteSwift',
      version: 15,
      exportedAt: new Date().toISOString(),
      data,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `quoteswift-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async importBackup(file: File): Promise<number> {
    const parsed = JSON.parse(await file.text()) as {
      app?: string;
      data?: Record<string, unknown>;
    };
    if (
      parsed.app !== 'QuoteSwift' ||
      !parsed.data ||
      typeof parsed.data !== 'object'
    )
      throw new Error('This is not a valid QuoteSwift backup.');
    let restored = 0;
    for (const key of this.businessKeys)
      if (key in parsed.data) {
        localStorage.setItem(key, JSON.stringify(parsed.data[key]));
        restored++;
      }
    return restored;
  }

  deleteBusinessData(): void {
    for (const key of this.businessKeys) localStorage.removeItem(key);
  }
  deleteEverything(): void {
    for (const key of Object.keys(localStorage))
      if (key.startsWith('quoteswift.')) localStorage.removeItem(key);
  }
}
