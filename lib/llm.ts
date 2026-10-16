import { z } from "zod";
import type { SearchFilters } from "./types";

/** The only shape accepted from an optional LLM provider. */
export const searchFiltersSchema = z
  .object({
    role: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    skill: z.array(z.string().trim().min(1)).max(20).optional(),
    seniority: z.string().trim().min(1).optional(),
    open_to_work: z.boolean().optional(),
    company_type: z.string().trim().min(1).optional(),
    education: z.string().trim().min(1).optional(),
    school: z.string().trim().min(1).optional(),
    language: z.string().trim().min(1).optional(),
  })
  .strict();

export function parseProviderFilters(value: unknown): SearchFilters | null {
  const parsed = searchFiltersSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
