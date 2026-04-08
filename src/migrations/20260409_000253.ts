import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "email_templates_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "deliveries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"letter_id" integer NOT NULL,
  	"recipient_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "letters_deliveries" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "letters_deliveries" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "deliveries_id" integer;
  ALTER TABLE "email_templates_images" ADD CONSTRAINT "email_templates_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "email_templates_images" ADD CONSTRAINT "email_templates_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_recipient_id_sponsors_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."sponsors"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "email_templates_images_order_idx" ON "email_templates_images" USING btree ("_order");
  CREATE INDEX "email_templates_images_parent_id_idx" ON "email_templates_images" USING btree ("_parent_id");
  CREATE INDEX "email_templates_images_image_idx" ON "email_templates_images" USING btree ("image_id");
  CREATE INDEX "deliveries_letter_idx" ON "deliveries" USING btree ("letter_id");
  CREATE INDEX "deliveries_recipient_idx" ON "deliveries" USING btree ("recipient_id");
  CREATE INDEX "deliveries_updated_at_idx" ON "deliveries" USING btree ("updated_at");
  CREATE INDEX "deliveries_created_at_idx" ON "deliveries" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_deliveries_fk" FOREIGN KEY ("deliveries_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_deliveries_id_idx" ON "payload_locked_documents_rels" USING btree ("deliveries_id");
  DROP TYPE "public"."enum_letters_deliveries_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_letters_deliveries_status" AS ENUM('sent', 'failed');
  CREATE TABLE "letters_deliveries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"recipient_id" integer NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"status" "enum_letters_deliveries_status" NOT NULL,
  	"error" varchar
  );
  
  ALTER TABLE "email_templates_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "deliveries" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "email_templates_images" CASCADE;
  DROP TABLE "deliveries" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_deliveries_fk";
  
  DROP INDEX "payload_locked_documents_rels_deliveries_id_idx";
  ALTER TABLE "letters_deliveries" ADD CONSTRAINT "letters_deliveries_recipient_id_sponsors_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."sponsors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "letters_deliveries" ADD CONSTRAINT "letters_deliveries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."letters"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "letters_deliveries_order_idx" ON "letters_deliveries" USING btree ("_order");
  CREATE INDEX "letters_deliveries_parent_id_idx" ON "letters_deliveries" USING btree ("_parent_id");
  CREATE INDEX "letters_deliveries_recipient_idx" ON "letters_deliveries" USING btree ("recipient_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "deliveries_id";`)
}
