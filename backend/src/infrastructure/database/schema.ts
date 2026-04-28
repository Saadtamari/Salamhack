import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const businessTypeEnum = pgEnum("business_type", [
  "freelancer",
  "small_business",
  "agency",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  fullNameAr: text("full_name_ar"),
  businessName: text("business_name"),
  businessNameAr: text("business_name_ar"),
  businessType: businessTypeEnum("business_type").default("freelancer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
