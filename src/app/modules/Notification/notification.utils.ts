import HttpStatus from "http-status";
import { ClientSession, Types } from "mongoose";
import AppError from "../../erros/AppError";
import { User } from "../User/user.model";
import { sendPushNotifications } from "../../utils/firebase/notification";
import {
  INotification,
  SendNotificationPayload,
} from "./notification.interface";
import { NotificationModel } from "./notification.model";

export const createNotification = async (
  payload: INotification,
  session?: ClientSession,
) => {
  if (!payload) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Payload is required");
  }

  const created = await NotificationModel.create([payload], { session });
  if (!created?.[0]) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Notification creation failed");
  }
  return created[0];
};

export const sendNotification = async (payload: SendNotificationPayload) => {
  const {
    recipientId,
    senderId,
    type = "general",
    title,
    message,
    data,
  } = payload;
  const recipientIdStr = recipientId.toString();

  let savedNotification;
  try {
    savedNotification = await createNotification({
      recipient: new Types.ObjectId(recipientIdStr),
      sender: senderId ? new Types.ObjectId(senderId.toString()) : null,
      type,
      title,
      message,
      data: data || {},
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to persist notification:", error);
  }

  try {
    const user = await User.findById(recipientIdStr).select("fcmToken");
    if (user?.fcmToken?.length) {
      await sendPushNotifications(user.fcmToken, title, message);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Push notification failed:", err);
  }

  return savedNotification;
};

export const notifyMany = async (
  recipientIds: Array<Types.ObjectId | string>,
  payload: Omit<SendNotificationPayload, "recipientId">,
) => {
  const unique = [...new Set(recipientIds.map((id) => id.toString()))];
  await Promise.all(
    unique.map((recipientId) =>
      sendNotification({ ...payload, recipientId }),
    ),
  );
};

export const notifyStaff = async (
  payload: Omit<SendNotificationPayload, "recipientId">,
) => {
  const staff = await User.find({
    role: { $in: ["admin", "manager"] },
    isDeleted: { $ne: true },
  }).select("_id");
  await notifyMany(
    staff.map((u) => u._id),
    payload,
  );
};
