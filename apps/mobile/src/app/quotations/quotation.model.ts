export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected';

export interface QuotationLineItem {
  id: string;
  catalogItemId: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
  taxAmount: number;
  total: number;
}

export interface Quotation {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerBusiness: string;
  issueDate: string;
  validUntil: string;
  status: QuotationStatus;
  items: QuotationLineItem[];
  discountRate: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

export type QuotationDraft = Omit<
  Quotation,
  'id' | 'number' | 'createdAt' | 'updatedAt'
>;
