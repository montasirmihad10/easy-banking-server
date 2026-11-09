import express from "express";
import { statControllers } from "./stats.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../interface/global";

const router = express.Router();

router.get(
  "/admin-stats",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  statControllers.getAdminStats,
);
router.get(
  "/last-month-stats",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  statControllers.getLastMonthStats,
);
router.get(
  "/bank-details-monitoring",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  statControllers.getBankDetails,
);
router.get(
  "/customer-stats",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  statControllers.getCustomerStats,
);
router.get(
  "/customer-additional-stats",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  statControllers.getAdditionalCustomerStats,
);

export const statRoutes = router;
