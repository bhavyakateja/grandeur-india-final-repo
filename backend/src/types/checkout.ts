export interface CheckoutSnapshotItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface CheckoutSnapshotAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface CheckoutSnapshot {
  addressId: string;

  address: CheckoutSnapshotAddress;

  items: CheckoutSnapshotItem[];

  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;

  couponCode?: string;
}