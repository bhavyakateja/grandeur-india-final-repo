import { z } from "zod";

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().trim().min(1).max(200),
  html: z.string().trim().min(1).max(100_000),
  text: z.string().trim().max(100_000).optional(),
});

export type SendEmailInput = z.infer<
  typeof sendEmailSchema
>;