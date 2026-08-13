import { logger } from "../logger";

export async function sendPush(
  to: string,
  message: string
) {
  logger.info({ to, messageLength: message.length }, "Push delivery requested");

  return true;
}
