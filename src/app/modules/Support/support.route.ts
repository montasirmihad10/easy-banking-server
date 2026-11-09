import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLE } from "../../interface/global";
import { supportControllers } from "./support.controller";
import { supportValidations } from "./support.validation";

const router = express.Router();

router.post(
  "/guest",
  validateRequest(supportValidations.createGuestSupportTicketSchema),
  supportControllers.createGuestTicket,
);

router.post(
  "/",
  auth(USER_ROLE.customer, USER_ROLE.manager, USER_ROLE.admin),
  validateRequest(supportValidations.createSupportTicketSchema),
  supportControllers.createTicket,
);

router.get(
  "/my",
  auth(USER_ROLE.customer, USER_ROLE.manager, USER_ROLE.admin),
  supportControllers.getMyTickets,
);

router.get(
  "/",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  supportControllers.getAllTickets,
);

router.get(
  "/:id",
  auth(USER_ROLE.customer, USER_ROLE.manager, USER_ROLE.admin),
  supportControllers.getTicketById,
);

router.post(
  "/:id/reply",
  auth(USER_ROLE.customer, USER_ROLE.manager, USER_ROLE.admin),
  validateRequest(supportValidations.replySupportTicketSchema),
  supportControllers.replyToTicket,
);

router.patch(
  "/:id",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  validateRequest(supportValidations.updateSupportTicketSchema),
  supportControllers.updateTicket,
);

export const supportRoutes = router;
