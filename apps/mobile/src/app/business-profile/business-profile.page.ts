import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonRippleEffect,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  businessOutline,
  cameraOutline,
  cardOutline,
  checkmarkCircle,
  locationOutline,
  walletOutline,
} from 'ionicons/icons';
import { BusinessProfile } from './business-profile.model';
import { BusinessProfileService } from './business-profile.service';

@Component({
  selector: 'qs-business-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonContent,
    IonIcon,
    IonRippleEffect,
  ],
  templateUrl: './business-profile.page.html',
  styleUrl: './business-profile.page.scss',
})
export class BusinessProfilePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly profiles = inject(BusinessProfileService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  readonly logoDataUrl = signal('');
  readonly logoError = signal('');
  readonly form;

  constructor() {
    addIcons({
      arrowBack,
      businessOutline,
      cameraOutline,
      cardOutline,
      checkmarkCircle,
      locationOutline,
      walletOutline,
    });
    const profile = this.profiles.get();
    this.logoDataUrl.set(profile.logoDataUrl);
    this.form = this.formBuilder.nonNullable.group({
      businessName: [
        profile.businessName,
        [Validators.required, Validators.minLength(2)],
      ],
      ownerName: [profile.ownerName, Validators.required],
      phone: [
        profile.phone,
        [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)],
      ],
      email: [profile.email, Validators.email],
      addressLine: [profile.addressLine, Validators.required],
      city: [profile.city, Validators.required],
      state: [profile.state, Validators.required],
      postalCode: [
        profile.postalCode,
        [Validators.required, Validators.pattern(/^\d{6}$/)],
      ],
      gstin: [
        profile.gstin,
        Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/),
      ],
      upiId: [profile.upiId, Validators.pattern(/^[\w.-]{2,}@[\w.-]{2,}$/)],
      bankName: [profile.bankName],
      accountName: [profile.accountName],
      accountNumber: [profile.accountNumber, Validators.pattern(/^\d{9,18}$/)],
      ifscCode: [
        profile.ifscCode,
        Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/),
      ],
    });
  }

  back(): void {
    void this.router.navigateByUrl('/');
  }

  chooseLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      this.logoError.set('Choose a JPG, PNG or WebP logo below 2 MB.');
      input.value = '';
      return;
    }
    this.logoError.set('');
    const reader = new FileReader();
    reader.onload = () => this.logoDataUrl.set(String(reader.result));
    reader.readAsDataURL(file);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const profile: BusinessProfile = {
      ...value,
      gstin: value.gstin.toUpperCase(),
      ifscCode: value.ifscCode.toUpperCase(),
      logoDataUrl: this.logoDataUrl(),
      updatedAt: '',
    };
    this.profiles.save(profile);
    const toast = await this.toastController.create({
      message: 'Business profile saved successfully',
      duration: 1800,
      color: 'success',
      icon: 'checkmark-circle',
      position: 'bottom',
    });
    await toast.present();
    await this.router.navigateByUrl('/');
  }

  hasError(control: keyof typeof this.form.controls, error: string): boolean {
    const field = this.form.controls[control];
    return field.touched && field.hasError(error);
  }
}
