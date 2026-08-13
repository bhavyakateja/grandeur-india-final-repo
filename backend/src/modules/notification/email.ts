import { logger } from "../logger";

export async function sendEmail(
  to: string,
  subject: string,
  message: string
) {
  logger.info({ to, subject, messageLength: message.length }, "Email delivery requested");

  return true;
}
