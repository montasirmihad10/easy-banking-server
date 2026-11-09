import { model, Schema } from "mongoose";
import { TTypeAccount } from "./type.interface";

const accountTypeSchema = new Schema<TTypeAccount>(
  {
    type: {
      type: String,
      enum: ["Savings", "Checkout", "Business"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const TypeModel = model<TTypeAccount>("Type", accountTypeSchema);
