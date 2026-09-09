import { Injectable } from '@angular/core';
import {
  BusinessProfile,
  EMPTY_BUSINESS_PROFILE,
} from './business-profile.model';

@Injectable({ providedIn: 'root' })
export class BusinessProfileService {
  private readonly storageKey = 'quoteswift.business-profile.v1';

  get(): BusinessProfile {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return { ...EMPTY_BUSINESS_PROFILE };
    try {
      return {
        ...EMPTY_BUSINESS_PROFILE,
        ...(JSON.parse(stored) as BusinessProfile),
      };
    } catch {
      return { ...EMPTY_BUSINESS_PROFILE };
    }
  }

  save(profile: BusinessProfile): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }),
    );
  }

  isConfigured(): boolean {
    return Boolean(this.get().businessName);
  }
}
