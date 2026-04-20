import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_rels" CASCADE;
  ALTER TABLE "users" RENAME COLUMN "national_id" TO "username";
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'reviewer', 'mediator', 'scholarshipHolder');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
  DROP INDEX "users_national_id_idx";
  ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
  ALTER TABLE "campaigns" ALTER COLUMN "send_at" SET NOT NULL;
  ALTER TABLE "letters" ALTER COLUMN "author_id" DROP NOT NULL;
  ALTER TABLE "scholarship_holders" ADD COLUMN "mediator_id" integer;
  ALTER TABLE "scholarship_holders" ADD COLUMN "user_id" integer;
  ALTER TABLE "letters" ADD COLUMN "approved" boolean DEFAULT false;
  ALTER TABLE "deliveries" ADD COLUMN "sent_at" timestamp(3) with time zone;
  ALTER TABLE "scholarship_holders" ADD CONSTRAINT "scholarship_holders_mediator_id_users_id_fk" FOREIGN KEY ("mediator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "scholarship_holders" ADD CONSTRAINT "scholarship_holders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");
  CREATE INDEX "scholarship_holders_mediator_idx" ON "scholarship_holders" USING btree ("mediator_id");
  CREATE INDEX "scholarship_holders_user_idx" ON "scholarship_holders" USING btree ("user_id");
  ALTER TABLE "campaigns" DROP COLUMN "active";
  ALTER TABLE "letters" DROP COLUMN "status";
  ALTER TABLE "letter_images" DROP COLUMN "alt";
  DROP TYPE "public"."enum_letters_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_letters_status" AS ENUM('draft', 'approved', 'sent');
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"scholarship_holders_id" integer
  );
  
  ALTER TABLE "users" RENAME COLUMN "username" TO "national_id";
  ALTER TABLE "scholarship_holders" DROP CONSTRAINT "scholarship_holders_mediator_id_users_id_fk";
  
  ALTER TABLE "scholarship_holders" DROP CONSTRAINT "scholarship_holders_user_id_users_id_fk";
  
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor', 'reviewer');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
  DROP INDEX "users_username_idx";
  DROP INDEX "scholarship_holders_mediator_idx";
  DROP INDEX "scholarship_holders_user_idx";
  ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
  ALTER TABLE "campaigns" ALTER COLUMN "send_at" DROP NOT NULL;
  ALTER TABLE "letters" ALTER COLUMN "author_id" SET NOT NULL;
  ALTER TABLE "campaigns" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "letters" ADD COLUMN "status" "enum_letters_status" DEFAULT 'draft' NOT NULL;
  ALTER TABLE "letter_images" ADD COLUMN "alt" varchar NOT NULL;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_scholarship_holders_fk" FOREIGN KEY ("scholarship_holders_id") REFERENCES "public"."scholarship_holders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_scholarship_holders_id_idx" ON "users_rels" USING btree ("scholarship_holders_id");
  CREATE UNIQUE INDEX "users_national_id_idx" ON "users" USING btree ("national_id");
  ALTER TABLE "scholarship_holders" DROP COLUMN "mediator_id";
  ALTER TABLE "scholarship_holders" DROP COLUMN "user_id";
  ALTER TABLE "letters" DROP COLUMN "approved";
  ALTER TABLE "deliveries" DROP COLUMN "sent_at";`)
}
