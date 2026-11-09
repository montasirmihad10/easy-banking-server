import config from "../config";
import { User } from "../modules/User/user.model";
import { seedBankSettings } from "../modules/Settings/settings.service";
import { PrivacyModel } from "../modules/Settings/privacy/Privacy.model";
import { TermsModel } from "../modules/Settings/Terms/Terms.model";
import { AboutModel } from "../modules/Settings/About/About.model";
import {
  DEFAULT_ABOUT_HTML,
  DEFAULT_PRIVACY_HTML,
  DEFAULT_TERMS_HTML,
} from "../modules/Settings/legalDefaults";
import { seedAccountTypes } from "../modules/AccountTypes/type.seed";

const seedPassword =
  process.env.SEED_DEMO_PASSWORD ||
  process.env.ADMIN_PASS ||
  (config.node_env === "production" ? "" : "ChangeMe123!");

const admin = {
  name: {
    firstName: "Montasir",
    lastName: "Mihad",
  },
  email: process.env.ADMIN_EMAIL || "admin@gmail.com",
  role: "admin",
  password: seedPassword,
  phoneNumber: "+522115242544",
  profilePhotoUrl:
    "https://i.ibb.co/MHpMRvT/c9c023a7-7a94-4101-b73e-c4b5bea09c38-enhanced.png",
};

const customer = {
  name: {
    firstName: "Demo",
    lastName: "Customer",
  },
  email: process.env.SEED_CUSTOMER_EMAIL || "customer@gmail.com",
  role: "customer",
  password: seedPassword,
  phoneNumber: "+8801700000001",
  profilePhotoUrl:
    "https://i.ibb.co/MHpMRvT/c9c023a7-7a94-4101-b73e-c4b5bea09c38-enhanced.png",
};

const manager = {
  name: {
    firstName: "Demo",
    lastName: "Manager",
  },
  email: process.env.SEED_MANAGER_EMAIL || "manager@gmail.com",
  role: "manager",
  password: seedPassword,
  phoneNumber: "+8801700000002",
  profilePhotoUrl:
    "https://i.ibb.co/MHpMRvT/c9c023a7-7a94-4101-b73e-c4b5bea09c38-enhanced.png",
};

const seedLegalPages = async () => {
  // Only insert defaults when missing — never overwrite admin edits on boot.
  const privacy = await PrivacyModel.findOne({});
  if (!privacy?.description) {
    await PrivacyModel.findOneAndUpdate(
      {},
      { description: DEFAULT_PRIVACY_HTML },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const terms = await TermsModel.findOne({});
  if (!terms?.description) {
    await TermsModel.findOneAndUpdate(
      {},
      { description: DEFAULT_TERMS_HTML },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const about = await AboutModel.findOne({});
  if (!about?.description) {
    await AboutModel.findOneAndUpdate(
      {},
      { description: DEFAULT_ABOUT_HTML },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
};

const seedSuperAdmin = async () => {
  if (!seedPassword) {
    await seedBankSettings();
    await seedLegalPages();
    await seedAccountTypes();
    return;
  }

  const isSuperAdminExist = await User.findOne({
    email: admin.email,
  });
  if (!isSuperAdminExist) {
    await User.create(admin);
  }

  const allowDemoUsers =
    config.node_env !== "production" ||
    process.env.SEED_DEMO_USERS === "true";

  if (allowDemoUsers) {
    const isCustomerExist = await User.findOne({
      email: customer.email,
    });
    if (!isCustomerExist) {
      await User.create(customer);
    }

    const isManagerExist = await User.findOne({
      email: manager.email,
    });
    if (!isManagerExist) {
      await User.create(manager);
    }
  }

  await seedBankSettings();
  await seedLegalPages();
  await seedAccountTypes();
};

export default seedSuperAdmin;
