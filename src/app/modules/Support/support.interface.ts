import { Types } from "mongoose";

export type TSupportCategory =
  | "account"
  | "deposit"
  | "withdraw"
  | "transfer"
  | "loan"
  | "card"
  | "technical"
  | "other";

export type TSupportStatus =
  | "open"
  | "in_progress"
  | "waiting_customer"
  | "resolved"
  | "closed";

export type TSupportPriority = "low" | "medium" | "high" | "urgent";

export interface ISupportMessage {
  sender?: Types.ObjectId | null;
  senderRole: "customer" | "manager" | "admin" | "guest";
  senderName: string;
  message: string;
  createdAt?: Date;
}

export interface ISupportTicket {
  _id?: Types.ObjectId;
  ticketNumber?: string;
  user?: Types.ObjectId | null;
  guestName?: string;
  guestEmail?: string;
  subject: string;
  description: string;
  category: TSupportCategory;
  status: TSupportStatus;
  priority: TSupportPriority;
  assignedTo?: Types.ObjectId | null;
  messages: ISupportMessage[];
  lastReplyAt?: Date;
  closedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
