export type CatalogItemType = 'product' | 'service';

export interface CatalogItem {
  id: string;
  type: CatalogItemType;
  name: string;
  code: string;
  description: string;
  unit: string;
  rate: number;
  taxRate: number;
  hsnSac: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CatalogItemDraft = Omit<
  CatalogItem,
  'id' | 'createdAt' | 'updatedAt'
>;
