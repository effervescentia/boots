CREATE TABLE "network_invite_record" (
	"invited_id" varchar(36) NOT NULL,
	"invited_by" varchar(36) NOT NULL,
	"network_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "network_invite_record" ADD CONSTRAINT "network_invite_record_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE cascade ON UPDATE no action;