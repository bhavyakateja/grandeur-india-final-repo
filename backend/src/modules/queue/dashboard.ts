import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";

import { serveStatic } from "@hono/node-server/serve-static";

import {
  getEmailQueue,
  getInvoiceQueue,
  getInventoryQueue,
  getDeadLetterQueue,
} from "./queues";

const serverAdapter = new HonoAdapter(serveStatic);

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(getEmailQueue()),
    new BullMQAdapter(getInvoiceQueue()),
    new BullMQAdapter(getInventoryQueue()),
    new BullMQAdapter(getDeadLetterQueue()),
  ],
  serverAdapter,
});

export default serverAdapter;