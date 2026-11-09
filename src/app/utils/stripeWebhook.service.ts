import Stripe from "stripe";
import { completeDeposit } from "./completePayments/completeDeposit";
import { completeDepostiLoan } from "./completePayments/completeDepostiLoan";

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const { metadata } = session;
  if (!metadata?.transactionType) return;

  if (metadata.transactionType === "deposit") {
    await completeDeposit(metadata, session.id);
  } else if (metadata.transactionType === "deposit-loan") {
    await completeDepostiLoan(metadata, session.id);
  }
};
