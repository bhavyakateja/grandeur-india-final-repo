export interface CreateOrderRequest {
  amount: number;
  currency: string;
}

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentGateway {
  createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse>;
  verify(data: VerifyPaymentRequest): Promise<boolean>;
  fetchPayment(paymentId: string): Promise<unknown>;
  refund(paymentId: string, amount?: number): Promise<void>;
}
