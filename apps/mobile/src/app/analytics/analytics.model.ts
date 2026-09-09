export type ReportRange = 30 | 90 | 365 | 0;

export interface MonthlyMetric {
  label: string;
  invoiced: number;
  collected: number;
}

export interface CustomerMetric {
  customerId: string;
  name: string;
  invoices: number;
  invoiced: number;
  collected: number;
}

export interface AnalyticsReport {
  quotationValue: number;
  invoicedValue: number;
  collectedValue: number;
  outstandingValue: number;
  conversionRate: number;
  averageInvoice: number;
  quoteStatuses: Record<'Draft' | 'Sent' | 'Accepted' | 'Rejected', number>;
  monthly: MonthlyMetric[];
  topCustomers: CustomerMetric[];
}
