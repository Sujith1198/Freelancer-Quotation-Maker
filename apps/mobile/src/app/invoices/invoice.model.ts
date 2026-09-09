import { QuotationLineItem } from '../quotations/quotation.model';

export interface Invoice {
  id: string;
  number: string;
  quotationId: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerBusiness: string;
  issueDate: string;
  dueDate: string;
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
