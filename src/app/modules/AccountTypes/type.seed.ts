import { TypeModel } from "./type.model";

export const DEFAULT_ACCOUNT_TYPES = [
  {
    type: "Savings" as const,
    description:
      "Grow your money with competitive savings interest and secure long-term deposits.",
    features: [
      "Earn annual savings interest from bank settings",
      "Ideal for emergency funds and long-term goals",
      "Protected with role-based account security",
      "Track deposits and interest in Activity",
      "Maintain minimum balance from bank settings",
    ],
  },
  {
    type: "Checking" as const,
    description:
      "Everyday banking for deposits, withdrawals, transfers, and daily spending.",
    features: [
      "Fast deposits via Stripe checkout",
      "Withdrawals with staff review for safety",
      "Instant EasyBank transfers",
      "Daily limits configured by the bank",
      "Full transaction history in My Banking",
    ],
  },
  {
    type: "Business" as const,
    description:
      "Higher limits and tools for business cash flow, payments, and operations.",
    features: [
      "Higher withdrawal and transfer limits",
      "Separate business account tracking",
      "Manager/admin oversight for large moves",
      "Secure loan access when eligible",
      "Dedicated branch support workflow",
    ],
  },
];

export const seedAccountTypes = async () => {
  for (const item of DEFAULT_ACCOUNT_TYPES) {
    const existing = await TypeModel.findOne({
      type: { $in: item.type === "Checking" ? ["Checking", "Checkout"] : [item.type] },
    });
    if (existing) {
      // Normalize legacy "Checkout" label to Checking without wiping custom features.
      if (existing.type === "Checkout") {
        existing.type = "Checking";
        await existing.save();
      }
      continue;
    }
    await TypeModel.create(item);
  }
};
