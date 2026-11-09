import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import router from "./app/routes";
import { stripeWebhookHandler } from "./app/utils/stripeWebhookHandler";
import { logHttpRequests } from "./logger/logger";
import { getRootTemplate } from "./rootTemplate";
import config from "./app/config";

const app: Application = express();

app.disable("x-powered-by");

// Basic hardening headers (no extra dependency)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

// Request logging
app.use(logHttpRequests);

// Stripe webhook must receive the raw body (before JSON parser)
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

// Parser & CORS
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://easy-banking-client.vercel.app",
      "http://localhost:3000",
      config.client_url,
    ].filter(Boolean) as string[],
    credentials: true,
  }),
);

// Static uploads (local disk fallback)
app.use("/public", express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Application API routes
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.status(200).send(getRootTemplate(config.app_name));
});

// 404 then global error handler (Express order)
app.use(notFound);
app.use(globalErrorHandler);

export default app;
