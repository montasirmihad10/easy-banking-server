export interface TTypeAccount {
  type: "Savings" | "Checkout" | "Business";
  description: string;
  features: string[];
}
