import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedAccountTypes } from "../src/app/modules/AccountTypes/type.seed";
import { seedBankSettings } from "../src/app/modules/Settings/settings.service";

dotenv.config();

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL missing");
  await mongoose.connect(uri);
  await seedAccountTypes();
  await seedBankSettings();
  console.log("Account types + website settings seeded");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
