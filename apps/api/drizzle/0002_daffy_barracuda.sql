CREATE TYPE "public"."family_role" AS ENUM('adult', 'child');--> statement-breakpoint
CREATE TYPE "public"."network_role" AS ENUM('leader');--> statement-breakpoint
CREATE TABLE "family" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_member" (
	"account_id" varchar(36) NOT NULL,
	"family_id" varchar(36) NOT NULL,
	"role" "family_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_member" (
	"account_id" varchar(36) NOT NULL,
	"network_id" varchar(36) NOT NULL,
	"role" "network_role",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "account_alias" CASCADE;--> statement-breakpoint
DROP TABLE "memo_boost" CASCADE;--> statement-breakpoint
DROP TABLE "memo" CASCADE;--> statement-breakpoint
DROP TABLE "text_content" CASCADE;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_member" ADD CONSTRAINT "network_member_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_member" ADD CONSTRAINT "network_member_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "description";--> statement-breakpoint
DROP TYPE "public"."memo_visibility";