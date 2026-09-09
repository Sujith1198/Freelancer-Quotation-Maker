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
  { path: '**', redirectTo: '' },
];
