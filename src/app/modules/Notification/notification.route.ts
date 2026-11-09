import express from "express";
import { notificationControllers } from "./notification.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../interface/global";

const router = express.Router();

router.get(
  "/",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  notificationControllers.getMyNotifications,
);

router.get(
  "/unread-count",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  notificationControllers.getUnreadCount,
);

router.patch(
  "/read-all",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  notificationControllers.markAllAsRead,
);

router.patch(
  "/:id/read",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  notificationControllers.markAsRead,
);

export const notificationRoutes = router;
