import { model, Schema } from "mongoose";
import { DEFAULT_BANK_SETTINGS, TBankSettings } from "./settings.interface";

const settingsSchema = new Schema<TBankSettings>(
  {
    key: { type: String, required: true, unique: true, default: "bank-config" },
    currency: { type: String, default: DEFAULT_BANK_SETTINGS.currency },
    defaultOpeningBalance: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.defaultOpeningBalance,
    },
    defaultMinimumBalance: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.defaultMinimumBalance,
    },
    oneAccountPerUser: {
      type: Boolean,
      default: DEFAULT_BANK_SETTINGS.oneAccountPerUser,
    },
    savingsAnnualInterestRate: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.savingsAnnualInterestRate,
    },
    interestCompoundingFrequencyPerYear: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.interestCompoundingFrequencyPerYear,
    },
    defaultLoanInterestRate: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.defaultLoanInterestRate,
    },
    maxOpenLoansPerUser: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.maxOpenLoansPerUser,
    },
    withdrawMaxPerMonth: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.withdrawMaxPerMonth,
    },
    withdrawMaxPerDay: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.withdrawMaxPerDay,
    },
    checkingWithdrawDailyAmountLimit: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.checkingWithdrawDailyAmountLimit,
    },
    businessWithdrawDailyAmountLimit: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.businessWithdrawDailyAmountLimit,
    },
    savingsWithdrawDailyAmountLimit: {
      type: Number,
      default: null,
    },
    checkingTransferDailyAmountLimit: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.checkingTransferDailyAmountLimit,
    },
    checkingTransferDailyCountLimit: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.checkingTransferDailyCountLimit,
    },
    businessTransferDailyAmountLimit: {
      type: Number,
      default: DEFAULT_BANK_SETTINGS.businessTransferDailyAmountLimit,
    },
    savingsTransferDailyAmountLimit: {
      type: Number,
      default: null,
    },
    savingsTransferDailyCountLimit: {
      type: Number,
      default: null,
    },
    allowAdminDirectBalanceEdit: {
      type: Boolean,
      default: DEFAULT_BANK_SETTINGS.allowAdminDirectBalanceEdit,
    },
    website: {
      type: Schema.Types.Mixed,
      default: DEFAULT_BANK_SETTINGS.website,
    },
  },
  { timestamps: true },
);

export const SettingsModel = model<TBankSettings>("Settings", settingsSchema);
