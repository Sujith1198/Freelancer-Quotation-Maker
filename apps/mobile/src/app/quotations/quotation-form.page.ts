import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  add,
  arrowBack,
  calculatorOutline,
  checkmarkCircle,
  documentTextOutline,
  personOutline,
  pricetagOutline,
  trashOutline,
} from 'ionicons/icons';
import { CatalogService } from '../catalog/catalog.service';
import { CustomerService } from '../customers/customer.service';
import { QuotationDraft, QuotationLineItem } from './quotation.model';
import { QuotationService } from './quotation.service';

@Component({
  selector: 'qs-quotation-form-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonRippleEffect,
  ],
  templateUrl: './quotation-form.page.html',
  styleUrl: './quotation-form.page.scss',
})
export class QuotationFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly quotations = inject(QuotationService);
  private readonly customerService = inject(CustomerService);
  private readonly catalogService = inject(CatalogService);
  private readonly toasts = inject(ToastController);
  readonly quoteId = this.route.snapshot.paramMap.get('id');
  readonly existing = this.quoteId
    ? this.quotations.find(this.quoteId)
    : undefined;
  readonly customers = this.customerService.list();
  readonly catalog = this.catalogService.list().filter((item) => item.active);
  readonly today = new Date().toISOString().slice(0, 10);
  readonly defaultValidUntil = new Date(Date.now() + 15 * 86400000)
    .toISOString()
    .slice(0, 10);
  readonly items = new FormArray(
    (this.existing?.items.length ? this.existing.items : [null]).map((item) =>
      this.createLine(item),
    ),
  );
  readonly form = this.fb.nonNullable.group({
    customerId: [this.existing?.customerId ?? '', Validators.required],
    issueDate: [this.existing?.issueDate ?? this.today, Validators.required],
    validUntil: [
      this.existing?.validUntil ?? this.defaultValidUntil,
      Validators.required,
    ],
    discountRate: [
      this.existing?.discountRate ?? 0,
      [Validators.min(0), Validators.max(100)],
    ],
    notes: [this.existing?.notes ?? ''],
    terms: [this.existing?.terms ?? 'Payment due within 7 days of acceptance.'],
    items: this.items,
  });
  constructor() {
    addIcons({
      add,
      arrowBack,
      calculatorOutline,
      checkmarkCircle,
      documentTextOutline,
      personOutline,
      pricetagOutline,
      trashOutline,
    });
  }
  addLine(): void {
    this.items.push(this.createLine(null));
  }
  removeLine(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
  }
  selectCatalog(index: number): void {
    const group = this.items.at(index);
    const item = this.catalog.find(
      (entry) => entry.id === group.controls.catalogItemId.value,
    );
    if (item)
      group.patchValue({
        name: item.name,
        description: item.description,
        unit: item.unit,
        rate: item.rate,
        taxRate: item.taxRate,
      });
  }
  lineAmount(index: number): number {
    const row = this.items.at(index).getRawValue();
    return Number(row.quantity || 0) * Number(row.rate || 0);
  }
  totals() {
    return this.quotations.calculate(
      this.items.getRawValue(),
      Number(this.form.controls.discountRate.value),
    );
  }
  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const customer = this.customers.find(
      (entry) => entry.id === value.customerId,
    );
    if (!customer) return;
    const totals = this.totals();
    const items: QuotationLineItem[] = value.items.map((row, index) => {
      const amount = Number(row.quantity) * Number(row.rate);
      const discountRatio = totals.subtotal
        ? totals.taxableAmount / totals.subtotal
        : 0;
      const taxAmount = (amount * discountRatio * Number(row.taxRate)) / 100;
      return {
        ...row,
        id: this.existing?.items[index]?.id ?? `LIN-${Date.now()}-${index}`,
        quantity: Number(row.quantity),
        rate: Number(row.rate),
        taxRate: Number(row.taxRate),
        amount,
        taxAmount,
        total: amount * discountRatio + taxAmount,
      };
    });
    const draft: QuotationDraft = {
      customerId: customer.id,
      customerName: customer.name,
      customerBusiness: customer.businessName,
      issueDate: value.issueDate,
      validUntil: value.validUntil,
      status: this.existing?.status ?? 'Draft',
      items,
      discountRate: Number(value.discountRate),
      ...totals,
      notes: value.notes,
      terms: value.terms,
    };
    this.quotations.save(draft, this.quoteId ?? undefined);
    const toast = await this.toasts.create({
      message: this.quoteId ? 'Quotation updated' : 'Quotation saved as draft',
      duration: 1600,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
    await this.router.navigateByUrl('/quotations');
  }
  private createLine(item: QuotationLineItem | null) {
    return this.fb.nonNullable.group({
      catalogItemId: [item?.catalogItemId ?? ''],
      name: [item?.name ?? '', Validators.required],
      description: [item?.description ?? ''],
      quantity: [
        item?.quantity ?? 1,
        [Validators.required, Validators.min(0.01)],
      ],
      unit: [item?.unit ?? 'piece', Validators.required],
      rate: [item?.rate ?? 0, [Validators.required, Validators.min(0)]],
      taxRate: [
        item?.taxRate ?? 18,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });
  }
}
