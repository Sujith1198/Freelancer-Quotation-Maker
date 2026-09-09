export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  gstin: string;
  upiId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  logoDataUrl: string;
  updatedAt: string;
}

export const EMPTY_BUSINESS_PROFILE: BusinessProfile = {
  businessName: '',
  ownerName: '',
  phone: '',
  email: '',
  addressLine: '',
  city: '',
  state: 'Tamil Nadu',
  postalCode: '',
  gstin: '',
  upiId: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
  ifscCode: '',
  logoDataUrl: '',
  updatedAt: '',
};
