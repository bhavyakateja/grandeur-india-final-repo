export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceAddress {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface InvoiceData {
  orderNumber: string;

  customerName: string;
  customerEmail: string;
  phone: string;

  address: InvoiceAddress;

  items: InvoiceItem[];

  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}