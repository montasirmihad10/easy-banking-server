import { model, Schema } from "mongoose";
import { ISupportTicket } from "./support.interface";

const supportMessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", default: null },
    senderRole: {
      type: String,
      enum: ["customer", "manager", "admin", "guest"],
      required: true,
    },
    senderName: { type: String, required: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: { type: String, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    guestName: { type: String, trim: true },
    guestEmail: { type: String, trim: true, lowercase: true, index: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "account",
        "deposit",
        "withdraw",
        "transfer",
        "loan",
        "card",
        "technical",
        "other",
      ],
      default: "other",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "waiting_customer", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    messages: { type: [supportMessageSchema], default: [] },
    lastReplyAt: { type: Date },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

supportTicketSchema.statics.generateTicketNumber = async function () {
  const latest = await this.findOne().sort({ createdAt: -1 }).lean();
  let nextId = 1001;
  if (latest?.ticketNumber) {
    const parts = String(latest.ticketNumber).split("-");
    const n = Number(parts[1]);
    if (!Number.isNaN(n)) nextId = n + 1;
  }
  return `EB-SUP-${nextId}`;
};

supportTicketSchema.pre("save", async function () {
  if (!this.ticketNumber) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ticketNumber = await (this.constructor as any).generateTicketNumber();
  }
});

export const SupportTicketModel = model<ISupportTicket>(
  "SupportTicket",
  supportTicketSchema,
);
