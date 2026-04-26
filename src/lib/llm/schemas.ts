import { z } from "zod";

export const parashaIdeaSchema = z.object({
  idea: z.string().min(5, "idea must be a non-empty short paragraph"),
  sourceVerses: z
    .array(
      z.object({
        ref: z.string().min(1),
        text: z.string().min(1),
      }),
    )
    .min(1, "at least one source verse is required")
    .max(3, "at most three source verses"),
});

export type ParashaIdea = z.infer<typeof parashaIdeaSchema>;

export const sanityReportSchema = z.object({
  status: z.enum(["ok", "minor", "major"]),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type SanityReport = z.infer<typeof sanityReportSchema>;
