import {
  pgTable,
  uuid,
  text,
  numeric,
  char,
  date,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { bonusTypeEnum, bonusStatusEnum } from "./enums";
import { users } from "./users";

export const bonuses = pgTable(
  "bonuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => users.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: char("currency", { length: 3 }).default("INR").notNull(),
    bonusType: bonusTypeEnum("bonus_type").notNull(),
    reason: text("reason").notNull(),
    periodMonth: date("period_month"),
    status: bonusStatusEnum("status").default("PENDING_APPROVAL").notNull(),
    awardedBy: uuid("awarded_by")
      .notNull()
      .references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    payoutDate: date("payout_date"),
    linkedReviewId: uuid("linked_review_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check("bonuses_amount_positive_chk", sql`${table.amount} > 0`),
    check(
      "bonuses_reason_min_length_chk",
      sql`length(trim(${table.reason})) >= 10`
    ),
    check(
      "bonuses_rejection_reason_chk",
      sql`${table.status} <> 'REJECTED' OR ${table.rejectionReason} IS NOT NULL`
    ),
    index("bonuses_employee_id_created_at_idx")
      .on(table.employeeId, table.createdAt.desc())
      .where(sql`${table.deletedAt} IS NULL`),
    index("bonuses_status_idx")
      .on(table.status)
      .where(sql`${table.deletedAt} IS NULL`),
    index("bonuses_period_month_idx").on(table.periodMonth),
  ]
);

export const bonusesRelations = relations(bonuses, ({ one }) => ({
  employee: one(users, {
    fields: [bonuses.employeeId],
    references: [users.id],
    relationName: "employeeBonuses",
  }),
  awardedByUser: one(users, {
    fields: [bonuses.awardedBy],
    references: [users.id],
    relationName: "awardedBonuses",
  }),
  approvedByUser: one(users, {
    fields: [bonuses.approvedBy],
    references: [users.id],
    relationName: "approvedBonuses",
  }),
}));
