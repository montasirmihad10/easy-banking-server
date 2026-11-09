import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { notificationServices } from "./notification.service";
import { TJwtUser } from "../../interface/global";
import { getParam } from "../../utils/getParam";

const getMyNotifications = catchAsync(async (req, res) => {
  const result = await notificationServices.getMyNotifications(
    req.user as TJwtUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const markAsRead = catchAsync(async (req, res) => {
  const result = await notificationServices.markAsRead(
    req.user as TJwtUser,
    getParam(req, "id"),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notification marked as read",
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req, res) => {
  await notificationServices.markAllAsRead(req.user as TJwtUser);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "All notifications marked as read",
    data: null,
  });
});

const getUnreadCount = catchAsync(async (req, res) => {
  const result = await notificationServices.getUnreadCount(
    req.user as TJwtUser,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Unread count retrieved",
    data: result,
  });
});

export const notificationControllers = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
