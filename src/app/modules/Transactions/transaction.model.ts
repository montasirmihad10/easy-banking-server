import { Schema, model } from "mongoose";
import { TTransaction } from "./transaction.interface";

const transactionSchema = new Schema<TTransaction>(
  {
    account: { type: String, ref: "Account" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    transaction_Id: { type: String, unique: true, sparse: true },
    transactionType: {
      type: String,
      enum: [
        "deposit",
        "withdraw",
        "transfer",
        "interest",
        "loan",
        "deposit-loan",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    fromAccount: { type: String },
    toAccount: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "rejected"],
      default: "pending",
    },
    description: { type: String },
    stripeSessionId: { type: String, unique: true, sparse: true },
    loan: { type: Schema.Types.ObjectId, ref: "Loan" },
    monthsToPay: { type: Number },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

transactionSchema.index({ account: 1, transactionType: 1, status: 1, createdAt: -1 });

export const TransactionModel = model<TTransaction>(
  "Transaction",
  transactionSchema,
);
