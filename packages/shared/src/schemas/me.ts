import { z } from "zod";

export const meResponseSchema = z.object({
  sub: z.string(),
  email: z.string().email().optional(),
  tenantId: z.string().optional(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
