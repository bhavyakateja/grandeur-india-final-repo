import { z } from "zod";

export const uploadSchema = z.object({
  folder: z.enum([
    "products",
    "reviews",
    "avatars",
  ]),
});

export type UploadInput = z.infer<typeof uploadSchema>;