CREATE TABLE "heartbeat_alert" (
	"heartbeat_id" varchar(36) NOT NULL,
	"ttl" integer NOT NULL,
	"family_id" varchar(36),
	"network_id" varchar(36),
	CONSTRAINT "heartbeat_alert_heartbeat_id_family_id_network_id_unique" UNIQUE("heartbeat_id","family_id","network_id")
);
--> statement-breakpoint
CREATE TABLE "heartbeat" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "heartbeat_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "network_audit_log" (
	"network_id" varchar(36) NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "network_invite_record" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "network_invite_record" CASCADE;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "heartbeat_alert" ADD CONSTRAINT "heartbeat_alert_heartbeat_id_heartbeat_id_fk" FOREIGN KEY ("heartbeat_id") REFERENCES "public"."heartbeat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat_alert" ADD CONSTRAINT "heartbeat_alert_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat_alert" ADD CONSTRAINT "heartbeat_alert_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat" ADD CONSTRAINT "heartbeat_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_audit_log" ADD CONSTRAINT "network_audit_log_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "heartbeat_alert_heartbeat_id_index" ON "heartbeat_alert" USING btree ("heartbeat_id");--> statement-breakpoint
CREATE INDEX "heartbeat_account_id_index" ON "heartbeat" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "family_member_account_id_index" ON "family_member" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "family_member_family_id_index" ON "family_member" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "network_member_account_id_index" ON "network_member" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "network_member_network_id_index" ON "network_member" USING btree ("network_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_account_id_family_id_unique" UNIQUE("account_id","family_id");--> statement-breakpoint
ALTER TABLE "network_member" ADD CONSTRAINT "network_member_account_id_network_id_unique" UNIQUE("account_id","network_id");