import mongoose from "mongoose";
import dotenv from "dotenv";
import { PrivacyModel } from "../src/app/modules/Settings/privacy/Privacy.model";
import { TermsModel } from "../src/app/modules/Settings/Terms/Terms.model";
import { AboutModel } from "../src/app/modules/Settings/About/About.model";
import {
  DEFAULT_ABOUT_HTML,
  DEFAULT_PRIVACY_HTML,
  DEFAULT_TERMS_HTML,
} from "../src/app/modules/Settings/legalDefaults";

dotenv.config();

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL missing");
  await mongoose.connect(uri);

  const force = process.argv.includes("--force");

  const privacy = await PrivacyModel.findOne({});
  if (force || !privacy?.description) {
    await PrivacyModel.findOneAndUpdate(
      {},
      { description: DEFAULT_PRIVACY_HTML },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    console.log(force ? "Overwrote privacy" : "Seeded privacy");
  } else {
    console.log("Skipped privacy (already set). Use --force to overwrite.");
  }

  const terms = await TermsModel.findOne({});
  if (force || !terms?.description) {
    await TermsModel.findOneAndUpdate(
      {},
      { description: DEFAULT_TERMS_HTML },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    console.log(force ? "Overwrote terms" : "Seeded terms");
  } else {
    console.log("Skipped terms (already set). Use --force to overwrite.");
  }

  const about = await AboutModel.findOne({});
  if (force || !about?.description) {
    await AboutModel.findOneAndUpdate(
      {},
      { description: DEFAULT_ABOUT_HTML },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    console.log(force ? "Overwrote about" : "Seeded about");
  } else {
    console.log("Skipped about (already set). Use --force to overwrite.");
  }

  console.log("Legal seed finished");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
