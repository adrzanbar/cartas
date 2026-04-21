import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "sponsors_national_id_idx";
  CREATE UNIQUE INDEX "sponsors_email_idx" ON "sponsors" USING btree ("email");
  ALTER TABLE "sponsors" DROP COLUMN "national_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "sponsors_email_idx";
  ALTER TABLE "sponsors" ADD COLUMN "national_id" varchar NOT NULL;
  CREATE UNIQUE INDEX "sponsors_national_id_idx" ON "sponsors" USING btree ("national_id");`)
}
