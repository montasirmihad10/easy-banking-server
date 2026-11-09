import { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { TJwtUser } from "../../interface/global";
import { NotificationModel } from "./notification.model";
import { INotification } from "./notification.interface";

export const createNotification = async (payload: Partial<INotification>) => {
  return NotificationModel.create(payload);
};

const getMyNotifications = async (
  user: TJwtUser,
  query: Record<string, unknown>,
) => {
  const recipientId = new Types.ObjectId(user.user);

  const notifQuery = new QueryBuilder(
    NotificationModel.find({ recipient: recipientId }).sort({ createdAt: -1 }),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await notifQuery.countTotal();
  const result = await notifQuery.modelQuery;
  return { meta, result };
};

const markAsRead = async (user: TJwtUser, notificationId: string) => {
  return NotificationModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(notificationId),
      recipient: new Types.ObjectId(user.user),
    },
    { $set: { isRead: true } },
    { new: true },
  );
};

const markAllAsRead = async (user: TJwtUser) => {
  await NotificationModel.updateMany(
    { recipient: new Types.ObjectId(user.user), isRead: false },
    { $set: { isRead: true } },
  );
  return null;
};

const getUnreadCount = async (user: TJwtUser) => {
  const count = await NotificationModel.countDocuments({
    recipient: new Types.ObjectId(user.user),
    isRead: false,
  });
  return { count };
};

export const notificationServices = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
