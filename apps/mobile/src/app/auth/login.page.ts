import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowForward,
  businessOutline,
  checkmarkCircle,
  eyeOffOutline,
  eyeOutline,
  flash,
  lockClosedOutline,
  mailOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { AuthService } from './auth.service';

@Component({
  selector: 'qs-login-page',
  standalone: true,
  imports: [FormsModule, IonButton, IonContent, IonIcon, IonInput, IonSpinner],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly registerMode = signal(false);
  readonly revealPassword = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  name = '';
  businessName = '';
  email = '';
  password = '';
  readonly strength = computed(() => {
    const value = this.password;
    return [
      value.length >= 8,
      /[A-Z]/.test(value),
      /[a-z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ].filter(Boolean).length;
  });

  constructor() {
    addIcons({
      arrowForward,
      businessOutline,
      checkmarkCircle,
      eyeOffOutline,
      eyeOutline,
      flash,
      lockClosedOutline,
      mailOutline,
      personOutline,
      shieldCheckmarkOutline,
    });
  }

  toggleMode(): void {
    this.registerMode.update((value) => !value);
    this.error.set('');
  }

  async submit(): Promise<void> {
    this.error.set('');
    if (!this.email.trim() || !this.password) {
      this.error.set('Enter your email and password.');
      return;
    }
    if (
      this.registerMode() &&
      (!this.name.trim() || this.password.length < 8)
    ) {
      this.error.set('Add your name and use at least 8 password characters.');
      return;
    }
    this.busy.set(true);
    try {
      if (this.registerMode()) {
        await this.auth.register({
          name: this.name,
          businessName: this.businessName,
          email: this.email,
          password: this.password,
        });
      } else {
        await this.auth.login(this.email, this.password);
      }
      await this.finish();
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Could not sign in. Try again.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  async useOffline(): Promise<void> {
    this.auth.continueOffline();
    await this.finish();
  }

  private finish(): Promise<boolean> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    return this.router.navigateByUrl(returnUrl);
  }
}
