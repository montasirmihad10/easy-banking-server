import { model, Schema } from "mongoose";
import { TTerms } from "./Terms.interface";

const termsSchema = new Schema<TTerms>(
  {
    description: { type: String, required: true },
  },
  { timestamps: true },
);

export const TermsModel = model<TTerms>("Terms", termsSchema);
