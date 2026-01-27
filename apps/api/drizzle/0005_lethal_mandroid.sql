CREATE TABLE "alert" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"family_id" varchar(36),
	"network_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heartbeat_expired_alert" (
	"alert_id" varchar(36) NOT NULL,
	"heartbeat_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "heartbeat_expired_alert_alert_id_heartbeat_id_unique" UNIQUE("alert_id","heartbeat_id")
);
--> statement-breakpoint
CREATE TABLE "heartbeat_trigger" (
	"heartbeat_id" varchar(36) NOT NULL,
	"ttl" integer NOT NULL,
	"family_id" varchar(36),
	"network_id" varchar(36),
	CONSTRAINT "heartbeat_trigger_heartbeat_id_family_id_network_id_unique" UNIQUE("heartbeat_id","family_id","network_id")
);
--> statement-breakpoint
ALTER TABLE "heartbeat_alert" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "heartbeat_alert" CASCADE;--> statement-breakpoint
ALTER TABLE "heartbeat" DROP CONSTRAINT "heartbeat_account_id_account_id_fk";
--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat_expired_alert" ADD CONSTRAINT "heartbeat_expired_alert_alert_id_alert_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alert"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat_expired_alert" ADD CONSTRAINT "heartbeat_expired_alert_heartbeat_id_heartbeat_id_fk" FOREIGN KEY ("heartbeat_id") REFERENCES "public"."heartbeat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat_trigger" ADD CONSTRAINT "heartbeat_trigger_heartbeat_id_heartbeat_id_fk" FOREIGN KEY ("heartbeat_id") REFERENCES "public"."heartbeat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat_trigger" ADD CONSTRAINT "heartbeat_trigger_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeat_trigger" ADD CONSTRAINT "heartbeat_trigger_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "heartbeat_expired_alert_alert_id_index" ON "heartbeat_expired_alert" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "heartbeat_expired_alert_heartbeat_id_index" ON "heartbeat_expired_alert" USING btree ("heartbeat_id");--> statement-breakpoint
CREATE INDEX "heartbeat_trigger_heartbeat_id_index" ON "heartbeat_trigger" USING btree ("heartbeat_id");--> statement-breakpoint
ALTER TABLE "heartbeat" ADD CONSTRAINT "heartbeat_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;