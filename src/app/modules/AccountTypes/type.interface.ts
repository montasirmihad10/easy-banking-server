export interface TTypeAccount {
  type: "Savings" | "Checking" | "Checkout" | "Business";
  description: string;
  features: string[];
}
