import { Queue, type DefaultJobOptions } from "bullmq";

import { redis } from "./redis";
import type { DeadLetterJob, EmailJob, InvoiceJob, ReleaseStockJob } from "./types";

const attempts = Number(process.env.QUEUE_ATTEMPTS ?? 3);
const retryDelayMs = Number(process.env.QUEUE_RETRY_DELAY_MS ?? 1_000);

export const defaultJobOptions: DefaultJobOptions = {
  attempts: Number.isSafeInteger(attempts) && attempts > 0 ? attempts : 3,
  backoff: {
    type: "exponential",
    delay: Number.isSafeInteger(retryDelayMs) && retryDelayMs > 0 ? retryDelayMs : 1_000,
  },
  removeOnComplete: {
    age: 86_400,
    count: 1_000,
  },
  removeOnFail: false,
};

let emailQueue: Queue<EmailJob> | undefined;
let invoiceQueue: Queue<InvoiceJob> | undefined;
let inventoryQueue: Queue<ReleaseStockJob> | undefined;
let deadLetterQueue: Queue<DeadLetterJob> | undefined;

export function getEmailQueue() {
  return emailQueue ??= new Queue<EmailJob>("email", { connection: redis, defaultJobOptions });
}

export function getInvoiceQueue() {
  return invoiceQueue ??= new Queue<InvoiceJob>("invoice", { connection: redis, defaultJobOptions });
}

export function getInventoryQueue() {
  return inventoryQueue ??= new Queue<ReleaseStockJob>("inventory", { connection: redis, defaultJobOptions });
}

export function getDeadLetterQueue() {
  return deadLetterQueue ??= new Queue<DeadLetterJob>("dead-letter", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: false,
      removeOnFail: false,
    },
  });
}
