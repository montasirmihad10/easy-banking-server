import { z } from "zod";

const websiteStatSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const websiteFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().min(1),
});

const websiteServiceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  highlight: z.string().min(1),
  details: z.array(z.string()),
});

const websiteSchema = z
  .object({
    brandName: z.string().optional(),
    heroEyebrow: z.string().optional(),
    heroTitleLine1: z.string().optional(),
    heroTitleLine2: z.string().optional(),
    heroSubtitle: z.string().optional(),
    heroPrimaryCta: z.string().optional(),
    heroSecondaryCta: z.string().optional(),
    heroStats: z.array(websiteStatSchema).optional(),
    deliveryTitle: z.string().optional(),
    deliveryBody: z.string().optional(),
    deliveryImage1: z.string().optional(),
    deliveryImage2: z.string().optional(),
    heroImage: z.string().optional(),
    brandLogo: z.string().optional(),
    contactTitle: z.string().optional(),
    contactSubtitle: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    contactAddress: z.string().optional(),
    supportHours: z.string().optional(),
    faqs: z.array(websiteFaqSchema).optional(),
    services: z.array(websiteServiceSchema).optional(),
  })
  .optional();

export const updateSettingsValidation = z.object({
  body: z.object({
    currency: z.string().min(1).optional(),
    defaultOpeningBalance: z.number().nonnegative().optional(),
    defaultMinimumBalance: z.number().nonnegative().optional(),
    oneAccountPerUser: z.boolean().optional(),
    savingsAnnualInterestRate: z.number().min(0).max(1).optional(),
    interestCompoundingFrequencyPerYear: z.number().int().positive().optional(),
    defaultLoanInterestRate: z.number().min(0).max(1).optional(),
    maxOpenLoansPerUser: z.number().int().positive().optional(),
    withdrawMaxPerMonth: z.number().int().positive().optional(),
    withdrawMaxPerDay: z.number().int().positive().optional(),
    checkingWithdrawDailyAmountLimit: z.number().positive().optional(),
    businessWithdrawDailyAmountLimit: z.number().positive().optional(),
    savingsWithdrawDailyAmountLimit: z.number().positive().nullable().optional(),
    checkingTransferDailyAmountLimit: z.number().positive().optional(),
    checkingTransferDailyCountLimit: z.number().int().positive().optional(),
    businessTransferDailyAmountLimit: z.number().positive().optional(),
    savingsTransferDailyAmountLimit: z.number().positive().nullable().optional(),
    savingsTransferDailyCountLimit: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
    allowAdminDirectBalanceEdit: z.boolean().optional(),
    website: websiteSchema,
  }),
});
