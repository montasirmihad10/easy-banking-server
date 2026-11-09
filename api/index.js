/* Vercel serverless entry — do NOT call app.listen() here. */
const mongoose = require("mongoose");

let app;
let seedStarted = false;

async function getApp() {
  if (!app) {
    // Compiled Express app from `npm run build` / vercel-build
    // eslint-disable-next-line import/no-unresolved
    app = require("../dist/app").default || require("../dist/app");
  }
  return app;
}

async function connectDb() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("DATABASE_URL is not defined");
  }
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(uri);
}

module.exports = async (req, res) => {
  try {
    await connectDb();

    if (!seedStarted) {
      seedStarted = true;
      try {
        // eslint-disable-next-line import/no-unresolved
        const seed = require("../dist/app/DB").default;
        Promise.resolve(seed()).catch((err) => {
          console.error("Seed error:", err);
        });
      } catch (err) {
        console.error("Seed load error:", err);
      }
    }

    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error("Vercel handler failed:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        message: error?.message || "Server failed to start",
      }),
    );
  }
};
