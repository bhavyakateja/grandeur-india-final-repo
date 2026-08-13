import { sendEmail } from "./email";
import { sendSMS } from "./sms";
import { sendPush } from "./push";

export async function email(
  to: string,
  subject: string,
  message: string
) {
  return sendEmail(
    to,
    subject,
    message
  );
}

export async function sms(
  to: string,
  message: string
) {
  return sendSMS(
    to,
    message
  );
}

export async function push(
  to: string,
  message: string
) {
  return sendPush(
    to,
    message
  );
}