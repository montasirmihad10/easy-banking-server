/* eslint-disable @typescript-eslint/no-explicit-any */
import app from "./app";
import config from "./app/config";
import mongoose from "mongoose";
import { Server } from "http";
import seedSuperAdmin from "./app/DB";
import { applyMonthlyInterests } from "./app/utils/updateInterest";
import cron from "node-cron";

let server: Server;

async function main() {
  // Vercel uses api/index.js — never boot a long-lived listener there.
  if (process.env.VERCEL) {
    // eslint-disable-next-line no-console
    console.log("Vercel runtime detected; skipping local server bootstrap");
    return;
  }

  try {
    if (!config.database_url) {
      throw new Error("DATABASE_URL is not defined in environment variables");
    }

    await mongoose.connect(config.database_url as string);
    // eslint-disable-next-line no-console
    console.log("Database connected successfully");

    seedSuperAdmin().catch((err) =>
      // eslint-disable-next-line no-console
      console.error("Super admin seeding error:", err),
    );

    cron.schedule("0 0 * * *", async () => {
      // eslint-disable-next-line no-console
      console.log("Running yearly compound interest job...");
      try {
        await applyMonthlyInterests();
        // eslint-disable-next-line no-console
        console.log("Yearly compound interest applied.");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log("Interest update failed", error);
      }
    });

    server = app.listen(Number(config.port), () => {
      // eslint-disable-next-line no-console
      console.log(
        `App listening on port ${config.port} [${config.node_env}]`,
      );
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal?: string) {
  try {
    // eslint-disable-next-line no-console
    console.log(
      `\n${signal ? signal + " received." : ""} Shutting down gracefully...`,
    );

    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      // eslint-disable-next-line no-console
      console.log("HTTP server closed");
    }

    await mongoose.disconnect();
    // eslint-disable-next-line no-console
    console.log("MongoDB connection closed");

    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error during shutdown", err);
    process.exit(1);
  }
}

main();

process.on("unhandledRejection", (reason: any) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled Rejection detected:", reason);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (error: Error) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught Exception detected:", error);
  gracefulShutdown("uncaughtException");
});

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});
