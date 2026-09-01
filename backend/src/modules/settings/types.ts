export interface StoreSettings {
  id: string;
  currency: string;
  gstRate: number;
  freeShippingThreshold: number;
  defaultShippingCharge: number;
  codEnabled: boolean;
  internationalShippingEnabled: boolean;
  storeEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}