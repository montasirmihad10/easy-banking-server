import { z } from "zod";

const categoryEnum = z.enum([
  "account",
  "deposit",
  "withdraw",
  "transfer",
  "loan",
  "card",
  "technical",
  "other",
]);

const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);
const statusEnum = z.enum([
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
]);

const createSupportTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3).max(160),
    description: z.string().min(10).max(5000),
    category: categoryEnum.optional(),
    priority: priorityEnum.optional(),
  }),
});

const createGuestSupportTicketSchema = z.object({
  body: z.object({
    guestName: z.string().min(2).max(100),
    guestEmail: z.string().email(),
    subject: z.string().min(3).max(160),
    description: z.string().min(10).max(5000),
    category: categoryEnum.optional(),
    priority: priorityEnum.optional(),
  }),
});

const replySupportTicketSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(5000),
  }),
});

const updateSupportTicketSchema = z.object({
  body: z.object({
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assignedTo: z.string().optional().nullable(),
    category: categoryEnum.optional(),
  }),
});

export const supportValidations = {
  createSupportTicketSchema,
  createGuestSupportTicketSchema,
  replySupportTicketSchema,
  updateSupportTicketSchema,
};
