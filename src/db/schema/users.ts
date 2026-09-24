import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { roleEnum, userStatusEnum } from "./enums";
import { departments } from "./departments";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeCode: text("employee_code").unique().notNull(),
    email: text("email").unique().notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    role: roleEnum("role").default("USER").notNull(),
    departmentId: uuid("department_id").references(() => departments.id),
    managerId: uuid("manager_id"),
    designation: text("designation"),
    dateOfJoining: date("date_of_joining"),
    phone: text("phone"),
    status: userStatusEnum("status").default("ACTIVE").notNull(),
    mustChangePassword: boolean("must_change_password").default(true).notNull(),
    sessionVersion: integer("session_version").default(1).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("users_department_id_idx")
      .on(table.departmentId)
      .where(sql`${table.deletedAt} IS NULL`),
    index("users_manager_id_idx").on(table.managerId),
    index("users_role_idx").on(table.role),
    index("users_status_idx").on(table.status),
    index("users_full_name_trgm_idx").on(table.fullName),
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
    relationName: "departmentMembers",
  }),
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
    relationName: "directReports",
  }),
  reports: many(users, { relationName: "directReports" }),
}));
