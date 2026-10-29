CREATE TABLE "messages" (
	"id" serial PRIMARY KEY,
	"text" text NOT NULL,
	"recipient" text DEFAULT '' NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"reports" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
