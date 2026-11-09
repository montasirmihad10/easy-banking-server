import Stripe from "stripe";
import HttpStatus from "http-status";
import config from "../config";
import AppError from "../erros/AppError";

const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: "2026-10-28.endive",
});

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

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "bdt",
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
      cancel_url: `${config.client_url}/dashboard/${metaData.role || "customer"}/my-account`,
      metadata: metaData,
    });

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
