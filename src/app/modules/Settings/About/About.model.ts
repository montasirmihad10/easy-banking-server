import { model, Schema } from "mongoose";
import { TAbout } from "./About.interface";

const aboutSchema = new Schema<TAbout>(
  {
    description: { type: String, required: true },
  },
  { timestamps: true },
);

export const AboutModel = model<TAbout>("About", aboutSchema);
