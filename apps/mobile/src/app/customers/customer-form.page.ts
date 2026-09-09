import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  checkmarkCircle,
  locationOutline,
  personOutline,
  readerOutline,
} from 'ionicons/icons';
import { CustomerDraft } from './customer.model';
import { CustomerService } from './customer.service';

@Component({
  selector: 'qs-customer-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonRippleEffect,
  ],
  templateUrl: './customer-form.page.html',
  styleUrl: './customer-form.page.scss',
})
export class CustomerFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customers = inject(CustomerService);
  private readonly toasts = inject(ToastController);
  readonly customerId = this.route.snapshot.paramMap.get('id');
  readonly existing = this.customerId
    ? this.customers.find(this.customerId)
    : undefined;
  readonly form = this.fb.nonNullable.group({
    name: [
      this.existing?.name ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    businessName: [this.existing?.businessName ?? ''],
    phone: [
      this.existing?.phone ?? '',
      [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)],
    ],
    email: [this.existing?.email ?? '', Validators.email],
    gstin: [
      this.existing?.gstin ?? '',
      Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/),
    ],
    address: [this.existing?.address ?? ''],
    city: [this.existing?.city ?? ''],
    state: [this.existing?.state ?? 'Tamil Nadu'],
    postalCode: [
      this.existing?.postalCode ?? '',
      Validators.pattern(/^$|^\d{6}$/),
    ],
    notes: [this.existing?.notes ?? ''],
  });
  constructor() {
    addIcons({
      arrowBack,
      businessOutline,
      checkmarkCircle,
      locationOutline,
      personOutline,
      readerOutline,
    });
  }
  hasError(control: keyof typeof this.form.controls, error: string): boolean {
    const field = this.form.controls[control];
    return field.touched && field.hasError(error);
  }
  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const draft: CustomerDraft = { ...value, gstin: value.gstin.toUpperCase() };
    this.customers.save(draft, this.customerId ?? undefined);
    const toast = await this.toasts.create({
      message: this.customerId ? 'Customer updated' : 'Customer added',
      duration: 1500,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
    await this.router.navigateByUrl('/customers');
  }
}
