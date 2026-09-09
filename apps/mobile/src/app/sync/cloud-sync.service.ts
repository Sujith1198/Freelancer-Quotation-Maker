import { Injectable, signal } from '@angular/core';

export type SyncState = 'idle' | 'connecting' | 'syncing' | 'success' | 'error';

export interface CloudConfig {
  apiUrl: string;
  token: string;
  email: string;
  lastSyncedAt: string;
  lastRevision: string;
}

interface SyncPayload {
  revision: string;
  updatedAt: string;
  records: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class CloudSyncService {
  private readonly configKey = 'quoteswift.cloud.v1';
  private readonly businessKeys = [
    'quoteswift.business-profile.v1',
    'quoteswift.customers.v1',
    'quoteswift.catalog.v1',
    'quoteswift.quotations.v1',
    'quoteswift.payments.v1',
    'quoteswift.invoices.v1',
    'quoteswift.reminders.v1',
  ];
  readonly state = signal<SyncState>('idle');
  readonly message = signal('');
  readonly config = signal<CloudConfig | null>(this.readConfig());

  async connect(
    apiUrlValue: string,
    email: string,
    password: string,
  ): Promise<void> {
    this.state.set('connecting');
    this.message.set('');
    try {
      const apiUrl = this.normalizeUrl(apiUrlValue);
      if (!apiUrl.startsWith('https://')) {
        throw new Error('Use a secure HTTPS API URL.');
      }
      const response = await this.request<{ token: string }>(
        apiUrl,
        '/auth/login',
        { method: 'POST', body: { email, password } },
      );
      const config: CloudConfig = {
        apiUrl,
        token: response.token,
        email: email.trim().toLowerCase(),
        lastSyncedAt: '',
        lastRevision: '',
      };
      this.saveConfig(config);
      this.state.set('success');
      this.message.set('Cloud account connected.');
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  async push(): Promise<void> {
    const config = this.requireConfig();
    this.state.set('syncing');
    this.message.set('Uploading this device data…');
    try {
      const payload = await this.snapshot();
      const saved = await this.request<SyncPayload>(config.apiUrl, '/sync', {
        method: 'PUT',
        token: config.token,
        body: payload,
      });
      this.markSynced(config, saved.revision);
      this.message.set('Cloud backup is up to date.');
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  async pull(): Promise<void> {
    const config = this.requireConfig();
    this.state.set('syncing');
    this.message.set('Downloading cloud data…');
    try {
      const snapshot = await this.request<SyncPayload | null>(
        config.apiUrl,
        '/sync',
        {
          method: 'GET',
          token: config.token,
        },
      );
      if (!snapshot)
        throw new Error('No cloud backup exists yet. Push this device first.');
      for (const key of this.businessKeys) {
        if (key in snapshot.records) {
          localStorage.setItem(key, JSON.stringify(snapshot.records[key]));
        }
      }
      this.markSynced(config, snapshot.revision);
      this.message.set('Cloud data restored. Reopen a screen to refresh it.');
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  async verify(): Promise<void> {
    const config = this.requireConfig();
    this.state.set('connecting');
    try {
      await this.request(config.apiUrl, '/auth/me', {
        method: 'GET',
        token: config.token,
      });
      this.state.set('success');
      this.message.set('Connection and session are healthy.');
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  disconnect(): void {
    localStorage.removeItem(this.configKey);
    this.config.set(null);
    this.state.set('idle');
    this.message.set('Cloud account disconnected from this device.');
  }

  private async snapshot(): Promise<SyncPayload> {
    const records: Record<string, unknown> = {};
    for (const key of this.businessKeys) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          records[key] = JSON.parse(value) as unknown;
        } catch {
          records[key] = value;
        }
      }
    }
    const updatedAt = new Date().toISOString();
    const bytes = new TextEncoder().encode(JSON.stringify(records));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const revision = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    return { revision, updatedAt, records };
  }

  private async request<T = unknown>(
    apiUrl: string,
    path: string,
    options: { method: string; token?: string; body?: unknown },
  ): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const result = (await response.json().catch(() => ({}))) as {
      data?: T;
      message?: string;
    };
    if (!response.ok)
      throw new Error(
        result.message || `Cloud request failed (${response.status}).`,
      );
    return result.data as T;
  }

  private markSynced(config: CloudConfig, revision: string): void {
    this.saveConfig({
      ...config,
      lastSyncedAt: new Date().toISOString(),
      lastRevision: revision,
    });
    this.state.set('success');
  }

  private fail(error: unknown): void {
    this.state.set('error');
    this.message.set(
      error instanceof Error ? error.message : 'Cloud sync failed.',
    );
  }

  private requireConfig(): CloudConfig {
    const config = this.config();
    if (!config) throw new Error('Connect a cloud account first.');
    return config;
  }

  private normalizeUrl(value: string): string {
    return value.trim().replace(/\/+$/, '');
  }
  private saveConfig(config: CloudConfig): void {
    localStorage.setItem(this.configKey, JSON.stringify(config));
    this.config.set(config);
  }
  private readConfig(): CloudConfig | null {
    try {
      return JSON.parse(
        localStorage.getItem(this.configKey) ?? 'null',
      ) as CloudConfig | null;
    } catch {
      return null;
    }
  }
}
