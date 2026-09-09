import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { onboardingGuard } from './onboarding/onboarding.guard';

export const appRoutes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./auth/account.page').then((m) => m.AccountPage),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: '',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'business-profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./business-profile/business-profile.page').then(
        (m) => m.BusinessProfilePage,
      ),
  },
  {
    path: 'customers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./customers/customer-list.page').then((m) => m.CustomerListPage),
  },
  {
    path: 'customers/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./customers/customer-form.page').then((m) => m.CustomerFormPage),
  },
  {
    path: 'customers/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./customers/customer-form.page').then((m) => m.CustomerFormPage),
  },
  {
    path: 'catalog',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./catalog/catalog-list.page').then((m) => m.CatalogListPage),
  },
  {
    path: 'catalog/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./catalog/catalog-form.page').then((m) => m.CatalogFormPage),
  },
  {
    path: 'catalog/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./catalog/catalog-form.page').then((m) => m.CatalogFormPage),
  },
  {
    path: 'quotations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./quotations/quotation-list.page').then(
        (m) => m.QuotationListPage,
      ),
  },
  {
    path: 'quotations/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./quotations/quotation-form.page').then(
        (m) => m.QuotationFormPage,
      ),
  },
  {
    path: 'quotations/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./quotations/quotation-form.page').then(
        (m) => m.QuotationFormPage,
      ),
  },
  {
    path: 'quotations/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./quotations/quotation-preview.page').then(
        (m) => m.QuotationPreviewPage,
      ),
  },
  {
    path: 'invoices',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./invoices/invoice-list.page').then((m) => m.InvoiceListPage),
  },
  {
    path: 'invoices/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./invoices/invoice-detail.page').then((m) => m.InvoiceDetailPage),
  },
  {
    path: 'reminders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./reminders/reminder-center.page').then(
        (m) => m.ReminderCenterPage,
      ),
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./analytics/analytics.page').then((m) => m.AnalyticsPage),
  },
  {
    path: 'cloud-sync',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./sync/cloud-sync.page').then((m) => m.CloudSyncPage),
  },
  {
    path: 'upgrade',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./billing/upgrade.page').then((m) => m.UpgradePage),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/settings.page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: '' },
];
