import { getDeadLetterQueue, getEmailQueue, getInvoiceQueue, getInventoryQueue } from "./queues";

import type {
  EmailJob,
  InvoiceJob,
  ReleaseStockJob,
  DeadLetterJob,
} from "./types";
import { queueJobsTotal } from "../metrics";

export async function enqueueEmail(
  job: EmailJob,
  jobId?: string
) {
  const queuedJob = await getEmailQueue().add(
    "send-email",
    job,
    {
      jobId,
    }
  );
  queueJobsTotal.inc({ queue: "email", job: "send-email", event: "enqueued" });
  return queuedJob;
}

export async function enqueueInvoice(
  job: InvoiceJob,
  jobId?: string
) {
  const queuedJob = await getInvoiceQueue().add(
    "generate-invoice",
    job,
    {
      jobId,
    }
  );
  queueJobsTotal.inc({ queue: "invoice", job: "generate-invoice", event: "enqueued" });
  return queuedJob;
}

export async function enqueueStockRelease(
  job: ReleaseStockJob
) {
  const queuedJob = await getInventoryQueue().add(
    "release-stock",
    job,
    {
      delay: 15 * 60 * 1000, // 15 minutes
    }
  );
  queueJobsTotal.inc({ queue: "inventory", job: "release-stock", event: "enqueued" });
  return queuedJob;
}

export async function enqueueDeadLetter(job: DeadLetterJob) {
  const queuedJob = await getDeadLetterQueue().add("dead-letter", job);
  queueJobsTotal.inc({ queue: job.originalQueue, job: job.originalJobName, event: "dead_lettered" });
  return queuedJob;
}
