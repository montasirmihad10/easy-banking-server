import { model, Schema } from "mongoose";
import { TBranch } from "./branch.interface";

const branchSchema = new Schema<TBranch>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    reserevedBalance: { type: Number, default: 0 },
    usedBalance: { type: Number, default: 0 },
    interestBalance: { type: Number, default: 0 },
    contactNumber: { type: String, required: true },
    email: { type: String },
    managers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    openingSchedule: {
      days: { type: [String], required: true },
      openTime: { type: String, required: true },
      closeTime: { type: String, required: true },
    },
    branchOpenedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

export const BranchModel = model<TBranch>("Branch", branchSchema);
