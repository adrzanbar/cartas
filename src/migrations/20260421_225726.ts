import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_roles" ADD VALUE 'tertiary-reviewer' BEFORE 'reviewer';
  ALTER TABLE "campaigns" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "letter_images" ADD COLUMN "owner_id" integer;
  ALTER TABLE "letter_images" ADD CONSTRAINT "letter_images_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "letter_images_owner_idx" ON "letter_images" USING btree ("owner_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "letter_images" DROP CONSTRAINT "letter_images_owner_id_users_id_fk";
  
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'reviewer', 'mediator', 'scholarshipHolder');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
  DROP INDEX "letter_images_owner_idx";
  ALTER TABLE "campaigns" DROP COLUMN "name";
  ALTER TABLE "letter_images" DROP COLUMN "owner_id";`)
}
