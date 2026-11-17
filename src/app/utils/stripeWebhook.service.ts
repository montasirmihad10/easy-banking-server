import Stripe from "stripe";
import { completeDeposit } from "./completePayments/completeDeposit";
import { completeDepostiLoan } from "./completePayments/completeDepostiLoan";
import { failPendingStripeTransaction } from "./stripePayment";

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const { metadata } = session;
  if (!metadata?.transactionType) return;

  if (session.payment_status !== "paid") {
    return;
  }

  const expectedAmount = Number(
    metadata.amount || metadata.paidBalance || 0,
  );
  if (expectedAmount > 0 && typeof session.amount_total === "number") {
    const paid = session.amount_total / 100;
    // Allow 1 unit tolerance for rounding
    if (Math.abs(paid - expectedAmount) > 1) {
      // eslint-disable-next-line no-console
      console.error(
        `Stripe amount mismatch: paid=${paid} expected=${expectedAmount} session=${session.id}`,
      );
      return;
    }
  }

  if (metadata.transactionType === "deposit") {
    await completeDeposit(metadata, session.id);
  } else if (metadata.transactionType === "deposit-loan") {
    await completeDepostiLoan(metadata, session.id);
  }
};

export const handleCheckoutSessionExpired = async (
  session: Stripe.Checkout.Session,
) => {
  if (!session.id) return;
  await failPendingStripeTransaction(session.id);
};

/** Delayed methods (bank debit, etc.): fulfill only after funds actually clear. */
export const handleCheckoutSessionAsyncPaymentSucceeded = async (
  session: Stripe.Checkout.Session,
) => {
  await handleCheckoutSessionCompleted(session);
};

/** Delayed payment failed after Checkout completed while still unpaid. */
export const handleCheckoutSessionAsyncPaymentFailed = async (
  session: Stripe.Checkout.Session,
) => {
  if (!session.id) return;
  await failPendingStripeTransaction(session.id);
};
