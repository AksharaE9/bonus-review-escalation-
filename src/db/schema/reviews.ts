import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  date,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { reviewTypeEnum, reviewStatusEnum, visibilityEnum } from "./enums";
import { users } from "./users";

export const competencies = pgTable("competencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  weight: numeric("weight", { precision: 4, scale: 2 }).default("1.00").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const reviewCycles = pgTable("review_cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  reviewType: reviewTypeEnum("review_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isOpen: boolean("is_open").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => users.id),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id),
    cycleId: uuid("cycle_id").references(() => reviewCycles.id),
    reviewType: reviewTypeEnum("review_type").notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    overallRating: numeric("overall_rating", { precision: 2, scale: 1 }),
    summary: text("summary").notNull(),
    strengths: text("strengths"),
    improvements: text("improvements"),
    goals: jsonb("goals").default(sql`'[]'::jsonb`),
    status: reviewStatusEnum("status").default("DRAFT").notNull(),
    visibility: visibilityEnum("visibility").default("SHARED").notNull(),
    employeeComment: text("employee_comment"),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "reviews_period_validity_chk",
      sql`${table.periodEnd} >= ${table.periodStart}`
    ),
    check(
      "reviews_summary_min_length_chk",
      sql`length(trim(${table.summary})) >= 10`
    ),
    check(
      "reviews_overall_rating_chk",
      sql`${table.overallRating} IS NULL OR (${table.overallRating} >= 1.0 AND ${table.overallRating} <= 5.0)`
    ),
    index("reviews_employee_id_period_end_idx")
      .on(table.employeeId, table.periodEnd.desc())
      .where(sql`${table.deletedAt} IS NULL`),
    index("reviews_reviewer_id_idx").on(table.reviewerId),
    index("reviews_status_idx").on(table.status),
  ]
);

export const reviewRatings = pgTable(
  "review_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    competencyId: uuid("competency_id")
      .notNull()
      .references(() => competencies.id),
    score: numeric("score", { precision: 2, scale: 1 }).notNull(),
    comment: text("comment"),
  },
  (table) => [
    uniqueIndex("review_ratings_review_competency_uniq").on(
      table.reviewId,
      table.competencyId
    ),
    check(
      "review_ratings_score_range_chk",
      sql`${table.score} >= 1.0 AND ${table.score} <= 5.0`
    ),
  ]
);

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  employee: one(users, {
    fields: [reviews.employeeId],
    references: [users.id],
    relationName: "employeeReviews",
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewerReviews",
  }),
  cycle: one(reviewCycles, {
    fields: [reviews.cycleId],
    references: [reviewCycles.id],
  }),
  ratings: many(reviewRatings),
}));

export const reviewRatingsRelations = relations(reviewRatings, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewRatings.reviewId],
    references: [reviews.id],
  }),
  competency: one(competencies, {
    fields: [reviewRatings.competencyId],
    references: [competencies.id],
  }),
}));
