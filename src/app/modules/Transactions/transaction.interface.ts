import { Types } from "mongoose";

export type TTransaction = {
  account?: string;
  user?: Types.ObjectId;
  transaction_Id?: string;
  transactionType:
    | "deposit"
    | "withdraw"
    | "transfer"
    | "interest"
    | "loan"
    | "deposit-loan";
  amount: number;
  fromAccount?: string;
  toAccount?: string;
  status?: "pending" | "completed" | "failed" | "rejected";
  description?: string;
  stripeSessionId?: string;
  loan?: Types.ObjectId;
  monthsToPay?: number;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
