import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
  customType,
  jsonb,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: string }>({
  dataType() {
    return "bytea";
  },
  toDriver(value: Buffer): string {
    return `\\x${value.toString("hex")}`;
  },
  fromDriver(value: string): Buffer {
    const hex = typeof value === "string" ? value.replace(/^\\x/, "") : "";
    return Buffer.from(hex, "hex");
  },
});

export const sourceTypeEnum = pgEnum("source_type", [
  "tanakh",
  "gmara",
  "zohar",
  "midrash",
  "other",
]);

export const stories = pgTable("stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 500 }),
  sourceType: sourceTypeEnum("source_type").notNull().default("other"),
  originalText: text("original_text").notNull(),
  childrenStory: text("children_story"),
  ttsScript: text("tts_script"),
  audioData: bytea("audio_data"),
  audioMimeType: varchar("audio_mime_type", { length: 50 }),
  model: varchar("model", { length: 100 }).notNull(),
  thinkingLevel: varchar("thinking_level", { length: 20 }),
  parashaRef: varchar("parasha_ref", { length: 100 }),
  parashaIdea: jsonb("parasha_idea").$type<{
    idea: string;
    sourceVerses: { ref: string; text: string }[];
  }>(),
  sanityReport: jsonb("sanity_report").$type<{
    status: "ok" | "minor" | "major";
    issues: string[];
    suggestions: string[];
  }>(),
  stepPrompts: jsonb("step_prompts").$type<{
    extractIdea: string;
    generateStory: string;
    sanityCheck: string;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
