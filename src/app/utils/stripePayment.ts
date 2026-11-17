import Stripe from "stripe";
import HttpStatus from "http-status";
import config from "../config";
import AppError from "../erros/AppError";
import { getBankSettings } from "../modules/Settings/settings.service";

const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: "2026-10-28.endive",
});

const cancelPathForRole = (role?: string) => {
  if (role === "manager") return "/portal";
  if (role === "admin") return "/dashboard/admin";
  return "/banking";
};

export const createPayment = async (
  amount: number,
  email: string,
  metaData: Stripe.Metadata,
) => {
  if (!amount || amount <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid payment amount");
  }

  const unitAmount = Math.round(Number(amount) * 100);
  if (unitAmount < 1) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Amount too small for Stripe");
  }

  const settings = await getBankSettings();
  const currency = String(settings.currency || "bdt").toLowerCase();
  const role = String(metaData.role || "customer");
  const cancelPath = cancelPathForRole(role);

  try {
    const session = await stripe.checkout.sessions.create(
      {
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: unitAmount,
              product_data: {
                name: "Easy Banking Payment",
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: email,
        success_url: `${config.client_url}/stripe/success?session_id=${metaData.transactionId}`,
        cancel_url: `${config.client_url}${cancelPath}`,
        metadata: metaData,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      },
      {
        idempotencyKey: `txn_${metaData.transactionId}`,
      },
    );

    if (!session.url) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to create Stripe checkout session",
      );
    }

    return { url: session.url, sessionId: session.id };
  } catch (error) {
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line no-console
    console.error("Stripe checkout error:", error);
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Unable to start Stripe payment. Please try again.",
    );
  }
};

export const failPendingStripeTransaction = async (stripeSessionId: string) => {
  const { TransactionModel } = await import(
    "../modules/Transactions/transaction.model"
  );
  if (!stripeSessionId) return null;
  return TransactionModel.findOneAndUpdate(
    {
      stripeSessionId,
      status: "pending",
      transactionType: { $in: ["deposit", "deposit-loan"] },
    },
    {
      status: "failed",
      description: "Stripe checkout expired or payment failed",
    },
    { new: true },
  );
};
