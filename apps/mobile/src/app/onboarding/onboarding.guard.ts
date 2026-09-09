import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
export const onboardingGuard: CanActivateFn = () =>
  localStorage.getItem('quoteswift.onboarding.v1') === 'done'
    ? true
    : inject(Router).createUrlTree(['/onboarding']);
