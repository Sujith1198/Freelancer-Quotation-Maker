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
  briefcaseOutline,
  checkmarkCircle,
  cubeOutline,
  pricetagOutline,
} from 'ionicons/icons';
import { CatalogItemDraft } from './catalog-item.model';
import { CatalogService } from './catalog.service';

@Component({
  selector: 'qs-catalog-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonRippleEffect,
  ],
  templateUrl: './catalog-form.page.html',
  styleUrl: './catalog-form.page.scss',
})
export class CatalogFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly toasts = inject(ToastController);
  readonly itemId = this.route.snapshot.paramMap.get('id');
  readonly existing = this.itemId ? this.catalog.find(this.itemId) : undefined;
  readonly units = [
    'piece',
    'hour',
    'day',
    'job',
    'kg',
    'meter',
    'box',
    'month',
  ];
  readonly taxRates = [0, 5, 12, 18, 28];
  readonly form = this.fb.nonNullable.group({
    type: [
      this.existing?.type ?? ('service' as 'product' | 'service'),
      Validators.required,
    ],
    name: [
      this.existing?.name ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    code: [this.existing?.code ?? ''],
    description: [this.existing?.description ?? ''],
    unit: [this.existing?.unit ?? 'job', Validators.required],
    rate: [this.existing?.rate ?? 0, [Validators.required, Validators.min(0)]],
    taxRate: [
      this.existing?.taxRate ?? 18,
      [Validators.required, Validators.min(0), Validators.max(100)],
    ],
    hsnSac: [
      this.existing?.hsnSac ?? '',
      Validators.pattern(/^$|^[A-Z0-9]{4,8}$/),
    ],
    active: [this.existing?.active ?? true],
  });
  constructor() {
    addIcons({
      arrowBack,
      briefcaseOutline,
      checkmarkCircle,
      cubeOutline,
      pricetagOutline,
    });
  }
  selectType(type: 'product' | 'service'): void {
    this.form.controls.type.setValue(type);
    if (!this.itemId)
      this.form.controls.unit.setValue(type === 'product' ? 'piece' : 'job');
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
    const draft: CatalogItemDraft = {
      ...value,
      rate: Number(value.rate),
      taxRate: Number(value.taxRate),
      code: value.code.toUpperCase(),
      hsnSac: value.hsnSac.toUpperCase(),
    };
    this.catalog.save(draft, this.itemId ?? undefined);
    const toast = await this.toasts.create({
      message: this.itemId ? 'Item updated' : 'Item added',
      duration: 1500,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
    await this.router.navigateByUrl('/catalog');
  }
}
