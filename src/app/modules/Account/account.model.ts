import { model, Schema } from "mongoose";
import { TBankAccount } from "./account.interface";

const accountSchema = new Schema<TBankAccount>(
  {
    accountNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", sparse: true },
    manager: { type: Schema.Types.ObjectId, ref: "Manager", sparse: true },
    admin: { type: Schema.Types.ObjectId, ref: "Admin", sparse: true },
    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    accountType: {
      type: String,
      enum: ["savings", "checking", "business"],
      required: true,
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "BDT" },
    status: {
      type: String,
      enum: ["pending", "active", "closed", "suspended"],
      required: true,
      default: "pending",
    },
    branchCode: { type: String },
    accountHolderName: { type: String },
    interestRate: { type: Number },
    transactions: {
      type: [Schema.Types.ObjectId],
      ref: "Transaction",
      default: [],
    },
    minimumBalance: { type: Number, default: 2000 },
    dateOfBirth: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    lastInterestDate: {
      type: Date,
      default: Date.now,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Model
export const AccountModel = model<TBankAccount>("Account", accountSchema);
