import Stripe from "stripe";
import { Response, Request } from "express";
import config from "../config";
import { handleCheckoutSessionCompleted } from "./stripeWebhook.service";

const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: "2026-10-28.endive",
});

const webhook = config.stripe_webhook_key as string;

export const stripeWebhookHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string | undefined;

  if (!sig || typeof sig !== "string") {
    res.status(400).send("Missing or invalid Stripe signature");
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhook);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "payment_intent.succeeded":
        // await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "charge.succeeded":
        // await handleChargeSucceeded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // ✅ Always send a 200 response
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    res.status(500).send("Internal Server Error");
  }
};
