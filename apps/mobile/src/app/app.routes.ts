import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'business-profile',
    loadComponent: () =>
      import('./business-profile/business-profile.page').then(
        (m) => m.BusinessProfilePage,
      ),
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./customers/customer-list.page').then((m) => m.CustomerListPage),
  },
  {
    path: 'customers/new',
    loadComponent: () =>
      import('./customers/customer-form.page').then((m) => m.CustomerFormPage),
  },
  {
    path: 'customers/:id/edit',
    loadComponent: () =>
      import('./customers/customer-form.page').then((m) => m.CustomerFormPage),
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./catalog/catalog-list.page').then((m) => m.CatalogListPage),
  },
  {
    path: 'catalog/new',
    loadComponent: () =>
      import('./catalog/catalog-form.page').then((m) => m.CatalogFormPage),
  },
  {
    path: 'catalog/:id/edit',
    loadComponent: () =>
      import('./catalog/catalog-form.page').then((m) => m.CatalogFormPage),
  },
  {
    path: 'quotations',
    loadComponent: () =>
      import('./quotations/quotation-list.page').then(
        (m) => m.QuotationListPage,
      ),
  },
  {
    path: 'quotations/new',
    loadComponent: () =>
      import('./quotations/quotation-form.page').then(
        (m) => m.QuotationFormPage,
      ),
  },
  {
    path: 'quotations/:id/edit',
    loadComponent: () =>
      import('./quotations/quotation-form.page').then(
        (m) => m.QuotationFormPage,
      ),
  },
  {
    path: 'quotations/:id',
    loadComponent: () =>
      import('./quotations/quotation-preview.page').then(
        (m) => m.QuotationPreviewPage,
      ),
  },
  {
    path: 'invoices',
    loadComponent: () =>
      import('./invoices/invoice-list.page').then((m) => m.InvoiceListPage),
  },
  {
    path: 'invoices/:id',
    loadComponent: () =>
      import('./invoices/invoice-detail.page').then((m) => m.InvoiceDetailPage),
  },
  {
    path: 'reminders',
    loadComponent: () =>
      import('./reminders/reminder-center.page').then(
        (m) => m.ReminderCenterPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
