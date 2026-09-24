import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import {
  escOriginEnum,
  escCategoryEnum,
  escSeverityEnum,
  escStatusEnum,
  visibilityEnum,
} from "./enums";
import { users } from "./users";

export const escalations = pgTable(
  "escalations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    refCode: text("ref_code").unique().notNull(),
    origin: escOriginEnum("origin").notNull(),
    raisedBy: uuid("raised_by")
      .notNull()
      .references(() => users.id),
    subjectEmployeeId: uuid("subject_employee_id").references(() => users.id),
    assignedTo: uuid("assigned_to").references(() => users.id),
    category: escCategoryEnum("category").notNull(),
    severity: escSeverityEnum("severity").default("MEDIUM").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: escStatusEnum("status").default("OPEN").notNull(),
    resolution: text("resolution"),
    isConfidential: boolean("is_confidential").default(false).notNull(),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "escalations_desc_min_length_chk",
      sql`length(trim(${table.description})) >= 10`
    ),
    check(
      "escalations_resolution_mandatory_chk",
      sql`${table.status} NOT IN ('RESOLVED','CLOSED') OR ${table.resolution} IS NOT NULL`
    ),
    index("escalations_subject_created_at_idx")
      .on(table.subjectEmployeeId, table.createdAt.desc())
      .where(sql`${table.deletedAt} IS NULL`),
    index("escalations_raised_by_idx").on(table.raisedBy),
    index("escalations_status_severity_idx").on(table.status, table.severity),
    index("escalations_assigned_active_idx")
      .on(table.assignedTo)
      .where(sql`${table.status} NOT IN ('CLOSED', 'RESOLVED')`),
    index("escalations_due_active_idx")
      .on(table.dueAt)
      .where(sql`${table.status} NOT IN ('CLOSED', 'RESOLVED', 'WITHDRAWN')`),
  ]
);

export const escalationComments = pgTable(
  "escalation_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escalationId: uuid("escalation_id")
      .notNull()
      .references(() => escalations.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    visibility: visibilityEnum("visibility").default("SHARED").notNull(),
    isStatusChange: boolean("is_status_change").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("escalation_comments_esc_created_idx").on(
      table.escalationId,
      table.createdAt.asc()
    ),
  ]
);

export const escalationsRelations = relations(escalations, ({ one, many }) => ({
  raisedByUser: one(users, {
    fields: [escalations.raisedBy],
    references: [users.id],
    relationName: "raisedEscalations",
  }),
  subjectEmployee: one(users, {
    fields: [escalations.subjectEmployeeId],
    references: [users.id],
    relationName: "subjectEscalations",
  }),
  assignedToUser: one(users, {
    fields: [escalations.assignedTo],
    references: [users.id],
    relationName: "assignedEscalations",
  }),
  comments: many(escalationComments),
}));

export const escalationCommentsRelations = relations(
  escalationComments,
  ({ one }) => ({
    escalation: one(escalations, {
      fields: [escalationComments.escalationId],
      references: [escalations.id],
    }),
    author: one(users, {
      fields: [escalationComments.authorId],
      references: [users.id],
    }),
  })
);
