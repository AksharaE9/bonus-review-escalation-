CREATE TYPE "public"."audit_action_enum" AS ENUM('CREATE', 'UPDATE', 'STATUS_CHANGE', 'SOFT_DELETE', 'RESTORE', 'ROLE_CHANGE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'EXPORT', 'VIEW_CONFIDENTIAL', 'PASSWORD_RESET');--> statement-breakpoint
CREATE TYPE "public"."bonus_status_enum" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."bonus_type_enum" AS ENUM('PERFORMANCE', 'SPOT', 'REFERRAL', 'FESTIVE', 'RETENTION', 'PROJECT', 'MILESTONE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."esc_category_enum" AS ENUM('PERFORMANCE', 'ATTENDANCE', 'BEHAVIOUR', 'POLICY_VIOLATION', 'CLIENT_COMPLAINT', 'PAYROLL', 'WORKPLACE', 'IT_ASSET', 'INTERPERSONAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."esc_origin_enum" AS ENUM('MANAGEMENT', 'EMPLOYEE');--> statement-breakpoint
CREATE TYPE "public"."esc_severity_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."esc_status_enum" AS ENUM('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'AWAITING_EMPLOYEE', 'RESOLVED', 'CLOSED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."review_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'ACKNOWLEDGED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."review_type_enum" AS ENUM('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'PROBATION', 'PROJECT', 'PIP', 'ADHOC');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('ADMIN', 'LEAD', 'USER');--> statement-breakpoint
CREATE TYPE "public"."user_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."visibility_enum" AS ENUM('INTERNAL', 'SHARED');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"lead_user_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_code" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"role" "role_enum" DEFAULT 'USER' NOT NULL,
	"department_id" uuid,
	"manager_id" uuid,
	"designation" text,
	"date_of_joining" date,
	"phone" text,
	"status" "user_status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_employee_code_unique" UNIQUE("employee_code"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "bonuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" char(3) DEFAULT 'INR' NOT NULL,
	"bonus_type" "bonus_type_enum" NOT NULL,
	"reason" text NOT NULL,
	"period_month" date,
	"status" "bonus_status_enum" DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"awarded_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"payout_date" date,
	"linked_review_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "bonuses_amount_positive_chk" CHECK ("bonuses"."amount" > 0),
	CONSTRAINT "bonuses_reason_min_length_chk" CHECK (length(trim("bonuses"."reason")) >= 10),
	CONSTRAINT "bonuses_rejection_reason_chk" CHECK ("bonuses"."status" <> 'REJECTED' OR "bonuses"."rejection_reason" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "competencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"weight" numeric(4, 2) DEFAULT '1.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"review_type" "review_type_enum" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"competency_id" uuid NOT NULL,
	"score" numeric(2, 1) NOT NULL,
	"comment" text,
	CONSTRAINT "review_ratings_score_range_chk" CHECK ("review_ratings"."score" >= 1.0 AND "review_ratings"."score" <= 5.0)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"cycle_id" uuid,
	"review_type" "review_type_enum" NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"overall_rating" numeric(2, 1),
	"summary" text NOT NULL,
	"strengths" text,
	"improvements" text,
	"goals" jsonb DEFAULT '[]'::jsonb,
	"status" "review_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"visibility" "visibility_enum" DEFAULT 'SHARED' NOT NULL,
	"employee_comment" text,
	"acknowledged_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "reviews_period_validity_chk" CHECK ("reviews"."period_end" >= "reviews"."period_start"),
	CONSTRAINT "reviews_summary_min_length_chk" CHECK (length(trim("reviews"."summary")) >= 10),
	CONSTRAINT "reviews_overall_rating_chk" CHECK ("reviews"."overall_rating" IS NULL OR ("reviews"."overall_rating" >= 1.0 AND "reviews"."overall_rating" <= 5.0))
);
--> statement-breakpoint
CREATE TABLE "escalation_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escalation_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"visibility" "visibility_enum" DEFAULT 'SHARED' NOT NULL,
	"is_status_change" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref_code" text NOT NULL,
	"origin" "esc_origin_enum" NOT NULL,
	"raised_by" uuid NOT NULL,
	"subject_employee_id" uuid,
	"assigned_to" uuid,
	"category" "esc_category_enum" NOT NULL,
	"severity" "esc_severity_enum" DEFAULT 'MEDIUM' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "esc_status_enum" DEFAULT 'OPEN' NOT NULL,
	"resolution" text,
	"is_confidential" boolean DEFAULT false NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"due_at" timestamp with time zone,
	"first_response_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "escalations_ref_code_unique" UNIQUE("ref_code"),
	CONSTRAINT "escalations_desc_min_length_chk" CHECK (length(trim("escalations"."description")) >= 10),
	CONSTRAINT "escalations_resolution_mandatory_chk" CHECK ("escalations"."status" NOT IN ('RESOLVED','CLOSED') OR "escalations"."resolution" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"actor_email" text,
	"actor_role" "role_enum",
	"action" "audit_action_enum" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"entity_label" text,
	"before" jsonb,
	"after" jsonb,
	"changed_fields" text[],
	"ip_address" text,
	"user_agent" text,
	"request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_awarded_by_users_id_fk" FOREIGN KEY ("awarded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_ratings" ADD CONSTRAINT "review_ratings_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_ratings" ADD CONSTRAINT "review_ratings_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_cycle_id_review_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."review_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_comments" ADD CONSTRAINT "escalation_comments_escalation_id_escalations_id_fk" FOREIGN KEY ("escalation_id") REFERENCES "public"."escalations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_comments" ADD CONSTRAINT "escalation_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_raised_by_users_id_fk" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_subject_employee_id_users_id_fk" FOREIGN KEY ("subject_employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_department_id_idx" ON "users" USING btree ("department_id") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "users_manager_id_idx" ON "users" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_full_name_trgm_idx" ON "users" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "bonuses_employee_id_created_at_idx" ON "bonuses" USING btree ("employee_id","created_at" DESC NULLS LAST) WHERE "bonuses"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "bonuses_status_idx" ON "bonuses" USING btree ("status") WHERE "bonuses"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "bonuses_period_month_idx" ON "bonuses" USING btree ("period_month");--> statement-breakpoint
CREATE UNIQUE INDEX "review_ratings_review_competency_uniq" ON "review_ratings" USING btree ("review_id","competency_id");--> statement-breakpoint
CREATE INDEX "reviews_employee_id_period_end_idx" ON "reviews" USING btree ("employee_id","period_end" DESC NULLS LAST) WHERE "reviews"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "reviews_reviewer_id_idx" ON "reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "escalation_comments_esc_created_idx" ON "escalation_comments" USING btree ("escalation_id","created_at");--> statement-breakpoint
CREATE INDEX "escalations_subject_created_at_idx" ON "escalations" USING btree ("subject_employee_id","created_at" DESC NULLS LAST) WHERE "escalations"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "escalations_raised_by_idx" ON "escalations" USING btree ("raised_by");--> statement-breakpoint
CREATE INDEX "escalations_status_severity_idx" ON "escalations" USING btree ("status","severity");--> statement-breakpoint
CREATE INDEX "escalations_assigned_active_idx" ON "escalations" USING btree ("assigned_to") WHERE "escalations"."status" NOT IN ('CLOSED', 'RESOLVED');--> statement-breakpoint
CREATE INDEX "escalations_due_active_idx" ON "escalations" USING btree ("due_at") WHERE "escalations"."status" NOT IN ('CLOSED', 'RESOLVED', 'WITHDRAWN');--> statement-breakpoint
CREATE INDEX "attachments_entity_idx" ON "attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_user_read_created_idx" ON "notifications" USING btree ("user_id","read_at","created_at" DESC NULLS LAST);