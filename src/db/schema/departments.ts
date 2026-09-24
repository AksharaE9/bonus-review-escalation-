import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  leadUserId: uuid("lead_user_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  leadUser: one(users, {
    fields: [departments.leadUserId],
    references: [users.id],
    relationName: "departmentLead",
  }),
  members: many(users, { relationName: "departmentMembers" }),
}));
