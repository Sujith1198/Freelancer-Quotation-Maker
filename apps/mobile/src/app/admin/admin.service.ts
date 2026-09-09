import { Injectable, signal } from '@angular/core';
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  business_name: string;
  status: 'active' | 'disabled';
  plan_code: 'free' | 'pro';
  current_period_end: string | null;
  created_at: string;
}
export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  disabledUsers: number;
  monthlyPrice: number;
  yearlyPrice: number;
}
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly key = 'quoteswift.admin.v1';
  readonly session = signal<{ apiUrl: string; token: string } | null>(
    this.read(),
  );
  readonly overview = signal<AdminOverview | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly error = signal('');
  readonly busy = signal(false);
  async login(apiUrl: string, email: string, password: string): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const root = apiUrl.trim().replace(/\/+$/, '');
      if (!root.startsWith('https://'))
        throw new Error('Secure HTTPS API URL required.');
      const auth = await this.request<{ token: string }>(
        root,
        '/auth/login',
        'POST',
        undefined,
        { email, password },
      );
      const session = { apiUrl: root, token: auth.token };
      this.session.set(session);
      localStorage.setItem(this.key, JSON.stringify(session));
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Admin login failed.');
      throw e;
    } finally {
      this.busy.set(false);
    }
  }
  async load(q = ''): Promise<void> {
    const s = this.required();
    this.busy.set(true);
    try {
      const [overview, users] = await Promise.all([
        this.request<AdminOverview>(
          s.apiUrl,
          '/admin/overview',
          'GET',
          s.token,
        ),
        this.request<AdminUser[]>(
          s.apiUrl,
          `/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`,
          'GET',
          s.token,
        ),
      ]);
      this.overview.set(overview);
      this.users.set(users);
      this.error.set('');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Admin data failed.');
      throw e;
    } finally {
      this.busy.set(false);
    }
  }
  async updateUser(
    user: AdminUser,
    status: 'active' | 'disabled',
    planCode: 'free' | 'pro',
  ): Promise<void> {
    const s = this.required();
    await this.request(s.apiUrl, `/admin/users/${user.id}`, 'PATCH', s.token, {
      status,
      planCode,
    });
    await this.load();
  }
  async savePricing(monthly: number, yearly: number): Promise<void> {
    const s = this.required();
    await this.request(s.apiUrl, '/admin/pricing', 'PUT', s.token, {
      monthlyPrice: monthly,
      yearlyPrice: yearly,
    });
    await this.load();
  }
  logout(): void {
    localStorage.removeItem(this.key);
    this.session.set(null);
    this.overview.set(null);
    this.users.set([]);
  }
  private async request<T>(
    root: string,
    path: string,
    method: string,
    token?: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${root}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await response.json()) as { data?: T; message?: string };
    if (!response.ok) throw new Error(json.message || 'Request failed.');
    return json.data as T;
  }
  private required() {
    const value = this.session();
    if (!value) throw new Error('Admin session required.');
    return value;
  }
  private read() {
    try {
      return JSON.parse(localStorage.getItem(this.key) ?? 'null') as {
        apiUrl: string;
        token: string;
      } | null;
    } catch {
      return null;
    }
  }
}
