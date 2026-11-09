import { model, Schema } from "mongoose";
import { TPrivacy } from "./Privacy.interface";

const privacySchema = new Schema<TPrivacy>(
  {
    description: { type: String, required: true },
  },
  { timestamps: true },
);

export const PrivacyModel = model<TPrivacy>("Privacy", privacySchema);
