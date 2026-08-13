import { Job, Worker } from "bullmq";
import type { Logger } from "pino";

import { redis } from "./redis";
import { enqueueDeadLetter } from "./jobs";
import type { EmailJob, InvoiceJob, ReleaseStockJob } from "./types";
import * as notificationService from "../notification/service";
import * as invoiceService from "../invoice/service";
import * as orderRepository from "../orders/repository";
import * as paymentRepository from "../payment/repository";
import * as uploadService from "../upload/service";
import { createLogger } from "../logger";
import { queueJobDurationSeconds, queueJobsInFlight, queueJobsTotal } from "../metrics";

const emailLogger = createLogger({ component: "queue", queue: "email" });
const invoiceLogger = createLogger({ component: "queue", queue: "invoice" });
const inventoryLogger = createLogger({ component: "queue", queue: "inventory" });

async function executeJob<T>(
  queue: string,
  job: Job<T>,
  jobLogger: Logger,
  processor: () => Promise<void>,
): Promise<void> {
  const startedAt = performance.now();
  queueJobsInFlight.inc({ queue });
  queueJobsTotal.inc({ queue, job: job.name, event: "started" });
  jobLogger.info({ jobId: job.id, jobName: job.name, attemptsMade: job.attemptsMade }, "Queue job started");

  try {
    await processor();
    queueJobsTotal.inc({ queue, job: job.name, event: "completed" });
    jobLogger.info({ jobId: job.id, jobName: job.name }, "Queue job completed");
  } finally {
    queueJobsInFlight.dec({ queue });
    queueJobDurationSeconds.observe({ queue, job: job.name }, (performance.now() - startedAt) / 1_000);
  }
}

function registerFailureHandler<T>(worker: Worker<T>, queue: string, queueLogger: Logger): void {
  worker.on("failed", (job, error) => {
    const jobName = job?.name ?? "unknown";
    queueJobsTotal.inc({ queue, job: jobName, event: "failed" });
    queueLogger.error({ error, jobId: job?.id, jobName, attemptsMade: job?.attemptsMade }, "Queue job failed");

    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) {
      return;
    }

    void enqueueDeadLetter({
      originalQueue: queue,
      originalJobId: job.id,
      originalJobName: job.name,
      attemptsMade: job.attemptsMade,
      failedAt: new Date().toISOString(),
      errorMessage: error.message,
      data: job.data,
    }).catch((deadLetterError: unknown) => {
      queueLogger.error({ error: deadLetterError, jobId: job.id, jobName: job.name }, "Dead-letter enqueue failed");
    });
  });

  worker.on("error", (error) => {
    queueLogger.error({ error }, "Queue worker error");
  });
}

const emailWorker = new Worker<EmailJob>(
  "email",
  async (job) => executeJob("email", job, emailLogger, async () => {
    await notificationService.email(job.data.to, job.data.subject, job.data.message);
  }),
  { connection: redis },
);

const invoiceWorker = new Worker<InvoiceJob>(
  "invoice",
  async (job) => executeJob("invoice", job, invoiceLogger, async () => {
    const order = await orderRepository.findForInvoice(job.data.orderId);
    if (!order) {
      throw new Error(`Order ${job.data.orderId} was not found`);
    }

    const invoice = await invoiceService.generateInvoice({
      orderId: order.orderNumber,
      customerName: order.fullName,
      customerEmail: order.user.email,
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: Number(order.tax),
      total: Number(order.total),
    });
    const file = new File([invoice], `invoice-${order.orderNumber}.pdf`, { type: "application/pdf" });
    const uploadedInvoice = await uploadService.upload(file, "invoices");

    await notificationService.email(
      order.user.email,
      `Invoice for order ${order.orderNumber}`,
      `Your invoice is ready: ${uploadedInvoice.url}`,
    );
  }),
  { connection: redis },
);

const inventoryWorker = new Worker<ReleaseStockJob>(
  "inventory",
  async (job) => executeJob("inventory", job, inventoryLogger, async () => {
    const payment = await paymentRepository.findById(job.data.paymentId);
    if (!payment || payment.status !== "PENDING") {
      return;
    }

    await paymentRepository.markFailed(payment.id);
    inventoryLogger.info({ jobId: job.id, paymentId: payment.id }, "Pending payment expired");
  }),
  { connection: redis },
);

registerFailureHandler(emailWorker, "email", emailLogger);
registerFailureHandler(invoiceWorker, "invoice", invoiceLogger);
registerFailureHandler(inventoryWorker, "inventory", inventoryLogger);

export const workers = [emailWorker, invoiceWorker, inventoryWorker];
