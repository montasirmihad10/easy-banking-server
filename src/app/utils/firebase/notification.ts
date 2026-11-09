/* eslint-disable @typescript-eslint/no-explicit-any */
import admin from "./firebase";

export const sendPushNotifications = async (
  tokens: string | string[],
  title: string,
  body: string,
) => {
  if (!tokens) return;

  const tokenArray: string[] = Array.isArray(tokens) ? tokens : [tokens];
  if (tokenArray.length === 0) return;

  const message = {
    notification: { title, body },
    tokens: tokenArray,
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  // Auto-detect invalid / expired tokens (remove from DB at call site if needed)
  response.responses.forEach((res: any, index: number) => {
    if (!res.success) {
      const errorCode = res.error?.code;
      if (
        errorCode === "messaging/registration-token-not-registered" ||
        errorCode === "messaging/invalid-registration-token"
      ) {
        // eslint-disable-next-line no-console
        console.log("Invalid FCM token:", tokenArray[index]);
      }
    }
  });

  return response;
};

export const sendPushToUserTokens = async (
  fcmTokens: string[] | undefined | null,
  title: string,
  body: string,
) => {
  if (!fcmTokens?.length) return;
  return sendPushNotifications(fcmTokens, title, body);
};
