export interface EmailJob {
  to: string;
  subject: string;
  message: string;
}

export interface InvoiceJob {
  orderId: string;
}

export interface ReleaseStockJob {
  paymentId: string;
}

export interface DeadLetterJob {
  originalQueue: string;
  originalJobId: string | undefined;
  originalJobName: string;
  attemptsMade: number;
  failedAt: string;
  errorMessage: string;
  data: unknown;
}
