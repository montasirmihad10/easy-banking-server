import { SettingsModel } from "./settings.model";
import {
  DEFAULT_BANK_SETTINGS,
  DEFAULT_WEBSITE_CONTENT,
  TBankSettings,
  TWebsiteContent,
} from "./settings.interface";

const mergeWebsite = (website?: Partial<TWebsiteContent> | null): TWebsiteContent => ({
  ...DEFAULT_WEBSITE_CONTENT,
  ...(website || {}),
  heroStats:
    website?.heroStats?.length ? website.heroStats : DEFAULT_WEBSITE_CONTENT.heroStats,
  faqs: website?.faqs?.length ? website.faqs : DEFAULT_WEBSITE_CONTENT.faqs,
  services: website?.services?.length
    ? website.services
    : DEFAULT_WEBSITE_CONTENT.services,
});

const normalizeSettings = (doc: TBankSettings): TBankSettings => ({
  ...DEFAULT_BANK_SETTINGS,
  ...doc,
  key: "bank-config",
  website: mergeWebsite(doc?.website),
});

export const getBankSettings = async (): Promise<TBankSettings> => {
  let settings = await SettingsModel.findOne({ key: "bank-config" });
  if (!settings) {
    settings = await SettingsModel.create({
      key: "bank-config",
      ...DEFAULT_BANK_SETTINGS,
    });
  } else if (!settings.website) {
    settings.website = DEFAULT_WEBSITE_CONTENT;
    await settings.save();
  }
  return normalizeSettings(settings.toObject() as TBankSettings);
};

/** Public website/customer-safe settings (hides admin-only controls). */
export const getPublicBankSettings = async () => {
  const settings = await getBankSettings();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { allowAdminDirectBalanceEdit, ...publicSettings } = settings;
  return publicSettings;
};

export const updateBankSettings = async (
  payload: Partial<Omit<TBankSettings, "key">>,
) => {
  const current = await getBankSettings();
  const nextWebsite = payload.website
    ? mergeWebsite({ ...current.website, ...payload.website })
    : current.website;

  const updated = await SettingsModel.findOneAndUpdate(
    { key: "bank-config" },
    {
      $set: {
        ...payload,
        website: nextWebsite,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return normalizeSettings(updated!.toObject() as TBankSettings);
};

export const seedBankSettings = async () => {
  const exists = await SettingsModel.findOne({ key: "bank-config" });
  if (!exists) {
    await SettingsModel.create({
      key: "bank-config",
      ...DEFAULT_BANK_SETTINGS,
    });
    return;
  }

  // Backfill website content if missing/empty so home + features never render blank.
  const website = exists.website || ({} as TWebsiteContent);
  const needsWebsite =
    !exists.website ||
    !website.services?.length ||
    !website.faqs?.length ||
    !website.heroStats?.length;

  if (needsWebsite) {
    exists.website = mergeWebsite(website);
    await exists.save();
  }
};
