import {
  pgTable,
  bigserial,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { auditActionEnum, roleEnum } from "./enums";
import { users } from "./users";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: uuid("actor_id").references(() => users.id),
    actorEmail: text("actor_email"),
    actorRole: roleEnum("actor_role"),
    action: auditActionEnum("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    entityLabel: text("entity_label"),
    before: jsonb("before"),
    after: jsonb("after"),
    changedFields: text("changed_fields").array(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    requestId: uuid("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_created_at_idx").on(table.createdAt.desc()),
    index("audit_logs_entity_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt.desc()
    ),
    index("audit_logs_actor_idx").on(table.actorId, table.createdAt.desc()),
    index("audit_logs_action_idx").on(table.action, table.createdAt.desc()),
  ]
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));
