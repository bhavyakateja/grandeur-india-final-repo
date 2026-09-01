import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100),

  email: z
    .email("Invalid email address")
    .transform((email) =>
      email.toLowerCase().trim(),
    ),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const loginSchema = z.object({
  email: z
    .email("Invalid email")
    .transform((email) =>
      email.toLowerCase().trim(),
    ),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export type SignupInput = z.infer<
  typeof signupSchema
>;

export type LoginInput = z.infer<
  typeof loginSchema
>;