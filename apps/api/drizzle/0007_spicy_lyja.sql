CREATE TYPE "public"."auth_device_type" AS ENUM('singleDevice', 'multiDevice');--> statement-breakpoint
CREATE TABLE "auth_android_credential" (
	"credential_id" text NOT NULL,
	"public_key" "bytea" NOT NULL,
	"web_authn_user_id" text NOT NULL,
	"counter" integer NOT NULL,
	"transports" "auth_transport"[] NOT NULL,
	"device_type" "auth_device_type" NOT NULL,
	"is_backed_up" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_android_credential_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "auth_web_credential" (
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"algorithm" "auth_algorithm" NOT NULL,
	"transports" "auth_transport"[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_web_credential_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
ALTER TABLE "auth_android_credential" ADD CONSTRAINT "auth_android_credential_credential_id_auth_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."auth_credential"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_web_credential" ADD CONSTRAINT "auth_web_credential_credential_id_auth_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."auth_credential"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_android_credential_credential_id_index" ON "auth_android_credential" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "auth_web_credential_credential_id_index" ON "auth_web_credential" USING btree ("credential_id");--> statement-breakpoint
ALTER TABLE "auth_credential" DROP COLUMN "public_key";--> statement-breakpoint
ALTER TABLE "auth_credential" DROP COLUMN "algorithm";--> statement-breakpoint
ALTER TABLE "auth_credential" DROP COLUMN "transports";