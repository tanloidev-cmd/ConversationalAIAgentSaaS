import { z } from "zod";

export const jwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email().optional(),
  "custom:tenantId": z.string().optional(),
  token_use: z.string().optional(),
  iss: z.string().optional(),
  exp: z.number().optional(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
