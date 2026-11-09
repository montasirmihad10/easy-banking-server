import dotenv from "dotenv";
import path from "path";

const NODE_ENV = process.env.NODE_ENV || "development";

// Load environment-specific .env file first, then base .env as fallback
dotenv.config({
  path: path.join(process.cwd(), `.env.${NODE_ENV}`),
  override: false,
});

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

export default {
  port: process.env.PORT || 5000,
  client_url:
    process.env.NODE_ENV === "production"
      ? process.env.CLIENT_LIVE_URL
      : process.env.CLIENT_URL,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  node_env: process.env.NODE_ENV || "development",
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  reset_pass_ui_link: process.env.RESET_PASS_UI_LINK,
  cloudinary_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  cloudinary_folder_name: process.env.CLOUDINARY_FOLDER_NAME,
  app_name: process.env.APP_NAME || "Easy Banking",
  node_mail_email: process.env.NODE_MAIL_EMAIL,
  node_mail_pass: process.env.NODE_MAIL_PASS,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  stripe_webhook_key: process.env.STRIPE_WEBHOOK_KEY,

  // Firebase (push notifications)
  firebase_type: process.env.FIREBASE_TYPE,
  firebase_project_id: process.env.FIREBASE_PROJECT_ID,
  firebase_private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  firebase_private_key: process.env.FIREBASE_PRIVATE_KEY,
  firebase_client_email: process.env.FIREBASE_CLIENT_EMAIL,
  firebase_client_id: process.env.FIREBASE_CLIENT_ID,
  firebase_auth_uri: process.env.FIREBASE_AUTH_URI,
  firebase_token_uri: process.env.FIREBASE_TOKEN_URI,
  firebase_auth_provider_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  firebase_client_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  firebase_universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};
