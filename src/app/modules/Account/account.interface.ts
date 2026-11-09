import { Types } from "mongoose";

export interface TBankAccount {
  accountNumber: string;
  user: Types.ObjectId;
  customer?: Types.ObjectId;
  manager?: Types.ObjectId;
  admin?: Types.ObjectId;
  branch: Types.ObjectId;
  accountType: "savings" | "checking" | "business";
  balance?: number;
  currency?: string;
  status: "pending" | "active" | "closed" | "suspended";
  branchCode?: string;
  accountHolderName?: string;
  interestRate?: number;
  transactions?: Types.ObjectId[];
  minimumBalance?: number;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  address: string;
  city: string;
  postalCode: string;
  country: string;
  lastInterestDate: Date;
  isDeleted: boolean;
}
