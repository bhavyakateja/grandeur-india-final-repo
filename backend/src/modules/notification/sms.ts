import { logger } from "../logger";

export async function sendSMS(
  to: string,
  message: string
) {
  logger.info({ to, messageLength: message.length }, "SMS delivery requested");

  return true;
}
