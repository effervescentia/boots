CREATE TABLE "notify_android" (
	"account_id" varchar(36) NOT NULL,
	"fcm_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notify_android_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
ALTER TABLE "notify_android" ADD CONSTRAINT "notify_android_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notify_android_account_id_index" ON "notify_android" USING btree ("account_id");