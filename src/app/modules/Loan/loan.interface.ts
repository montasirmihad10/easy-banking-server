import { Types } from "mongoose";

export interface TLoan {
  account?: Types.ObjectId; // Reference to the Account
  accountNumber?: string;
  user?: Types.ObjectId; // Reference to the User
  branch: Types.ObjectId; // Reference to the Branch
  loanAmount: number; // Total loan amount
  interestRate?: number; // Annual interest rate (e.g., 0.1 for 10%)
  term?: number; // Loan term in months or years (your choice)
  startDate?: Date; // When the loan starts
  endDate?: Date; // When loan should be fully paid
  remainingBalance?: number; // How much left to repay
  status?: "pending" | "approved" | "rejected" | "active" | "paid";
  repaymentSchedule?: Array<{
    dueDate: Date;
    amountDue: number;
    paid: boolean;
    paidDate?: Date;
  }>;
  isDeleted: boolean;
}
