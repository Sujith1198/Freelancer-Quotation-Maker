export interface Customer {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerDraft = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
