import admin from "firebase-admin";
import config from "../../config";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: config.firebase_type,
      project_id: config.firebase_project_id,
      private_key_id: config.firebase_private_key_id,
      private_key: config.firebase_private_key?.replace(/\\n/g, "\n"),
      client_email: config.firebase_client_email,
      client_id: config.firebase_client_id,
      auth_uri: config.firebase_auth_uri,
      token_uri: config.firebase_token_uri,
      auth_provider_x509_cert_url: config.firebase_auth_provider_cert_url,
      client_x509_cert_url: config.firebase_client_cert_url,
      universe_domain: config.firebase_universe_domain,
    } as admin.ServiceAccount),
  });
}

export default admin;
