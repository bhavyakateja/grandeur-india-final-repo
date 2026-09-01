import { resend } from "../../config/resend";
import { env } from "../../config/env";
import { InternalServerException } from "../../exceptions/InternalServerException";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput) {
  const payload = {
    from: env.RESEND_FROM_EMAIL,
    to: [to],
    subject,
    html,
    ...(text !== undefined ? { text } : {}),
  };

  const { data, error } =
    await resend.emails.send(payload);

  if (error) {
    throw new InternalServerException(
      `Email delivery failed: ${error.message}`,
    );
  }

  return {
    id: data?.id ?? null,
  };
}