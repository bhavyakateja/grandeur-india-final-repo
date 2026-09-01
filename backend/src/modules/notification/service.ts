import { sendEmail } from "./email";
import { env } from "../../config/env";

import type {
  AdminNotificationPayload,
  NotificationPayload,
} from "./types";

/**
 * Send an email to a customer.
 */
export async function email(
  payload: NotificationPayload,
) {
  return sendEmail({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    ...(payload.text !== undefined
      ? { text: payload.text }
      : {}),
  });
}

/**
 * Send an important notification to the admin.
 */
export async function adminEmailNotification(
  payload: AdminNotificationPayload,
) {
  return sendEmail({
    to: env.RESEND_ADMIN_EMAIL,
    subject: payload.subject,
    html: payload.html,
    ...(payload.text !== undefined
      ? { text: payload.text }
      : {}),
  });
}