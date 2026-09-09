import { Injectable, signal } from '@angular/core';

export type AccountMode = 'account' | 'offline';

export interface AccountSession {
  userId: string;
  name: string;
  email: string;
  businessName: string;
  mode: AccountMode;
  token: string;
  createdAt: string;
}

interface LocalAccount {
  id: string;
  name: string;
  email: string;
  businessName: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersKey = 'quoteswift.auth.users.v1';
  private readonly sessionKey = 'quoteswift.auth.session.v1';
  readonly session = signal<AccountSession | null>(this.readSession());

  isAuthenticated(): boolean {
    return this.session() !== null;
  }

  async register(input: {
    name: string;
    businessName: string;
    email: string;
    password: string;
  }): Promise<AccountSession> {
    const email = input.email.trim().toLowerCase();
    const users = this.readUsers();
    if (users.some((user) => user.email === email)) {
      throw new Error('An account already exists for this email.');
    }
    const salt = this.randomToken(16);
    const account: LocalAccount = {
      id: `ACC-${this.randomToken(9)}`,
      name: input.name.trim(),
      businessName: input.businessName.trim(),
      email,
      salt,
      passwordHash: await this.hashPassword(input.password, salt),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(this.usersKey, JSON.stringify([...users, account]));
    return this.createSession(account, 'account');
  }

  async login(emailValue: string, password: string): Promise<AccountSession> {
    const email = emailValue.trim().toLowerCase();
    const account = this.readUsers().find((user) => user.email === email);
    if (
      !account ||
      (await this.hashPassword(password, account.salt)) !== account.passwordHash
    ) {
      throw new Error('Email or password is incorrect.');
    }
    return this.createSession(account, 'account');
  }

  continueOffline(): AccountSession {
    const now = new Date().toISOString();
    const session: AccountSession = {
      userId: 'LOCAL-OFFLINE',
      name: 'Offline user',
      businessName: 'QuoteSwift',
      email: '',
      mode: 'offline',
      token: this.randomToken(24),
      createdAt: now,
    };
    return this.saveSession(session);
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    this.session.set(null);
  }

  private createSession(
    account: LocalAccount,
    mode: AccountMode,
  ): AccountSession {
    return this.saveSession({
      userId: account.id,
      name: account.name,
      email: account.email,
      businessName: account.businessName,
      mode,
      token: this.randomToken(32),
      createdAt: new Date().toISOString(),
    });
  }

  private saveSession(session: AccountSession): AccountSession {
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    this.session.set(session);
    return session;
  }

  private readSession(): AccountSession | null {
    try {
      return JSON.parse(
        localStorage.getItem(this.sessionKey) ?? 'null',
      ) as AccountSession | null;
    } catch {
      return null;
    }
  }

  private readUsers(): LocalAccount[] {
    try {
      return JSON.parse(
        localStorage.getItem(this.usersKey) ?? '[]',
      ) as LocalAccount[];
    } catch {
      return [];
    }
  }

  private randomToken(bytes: number): string {
    const values = crypto.getRandomValues(new Uint8Array(bytes));
    return Array.from(values, (value) =>
      value.toString(16).padStart(2, '0'),
    ).join('');
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: encoder.encode(salt),
        iterations: 120_000,
      },
      key,
      256,
    );
    return Array.from(new Uint8Array(derived), (value) =>
      value.toString(16).padStart(2, '0'),
    ).join('');
  }
}
