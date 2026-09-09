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
  { path: '**', redirectTo: '' },
];
