export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';

export interface PaymentRecord {
  quotationId: string;
  status: PaymentStatus;
  amountPaid: number;
  transactionReference: string;
  paidAt: string;
  updatedAt: string;
}
