/* eslint-disable @typescript-eslint/no-explicit-any */
import admin from "./firebase";
import { User } from "../../modules/User/user.model";

export const sendPushNotifications = async (
  tokens: string | string[],
  title: string,
  body: string,
  data?: Record<string, string>,
) => {
  if (!tokens) return;

  const tokenArray: string[] = Array.isArray(tokens) ? tokens : [tokens];
  if (tokenArray.length === 0) return;

  const message = {
    notification: { title, body },
    tokens: tokenArray,
    ...(data
      ? {
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
          ),
        }
      : {}),
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  const invalidTokens: string[] = [];
  response.responses.forEach((res: any, index: number) => {
    if (!res.success) {
      const errorCode = res.error?.code;
      if (
        errorCode === "messaging/registration-token-not-registered" ||
        errorCode === "messaging/invalid-registration-token"
      ) {
        invalidTokens.push(tokenArray[index]);
      }
    }
  });

  if (invalidTokens.length) {
    try {
      await User.updateMany(
        { fcmToken: { $in: invalidTokens } },
        { $pull: { fcmToken: { $in: invalidTokens } } },
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to prune invalid FCM tokens:", err);
    }
  }

  return response;
};

export const sendPushToUserTokens = async (
  fcmTokens: string[] | undefined | null,
  title: string,
  body: string,
  data?: Record<string, string>,
) => {
  if (!fcmTokens?.length) return;
  return sendPushNotifications(fcmTokens, title, body, data);
};
