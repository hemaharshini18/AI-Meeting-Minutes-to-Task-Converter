import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  assignee: text("assignee"),
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("P3"),
  status: text("status").notNull().default("pending"),
  originalInput: text("original_input"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  name: true,
  description: true,
  assignee: true,
  priority: true,
  status: true,
  originalInput: true,
}).extend({
  dueDate: z.union([z.string(), z.date()]).optional().transform(val => {
    if (!val) return null;
    return typeof val === 'string' ? new Date(val) : val;
  }).nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const parseTaskSchema = z.object({
  input: z.string().min(1, "Task input is required"),
});

export type ParseTaskRequest = z.infer<typeof parseTaskSchema>;

export interface ParsedTask {
  name: string;
  assignee?: string;
  dueDate?: Date;
  dueTime?: string;
  priority: string;
  isValid: boolean;
  warnings: string[];
  errors: string[];
}
