import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const messages = pgTable("messages", {
  id: serial().primaryKey(),
  text: text().notNull(),
  to: text("recipient").notNull().default(""),
  likes: integer().notNull().default(0),
  reports: integer().notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
