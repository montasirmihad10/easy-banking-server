import express from "express";
import { accountControllers } from "./account.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../interface/global";
import validateRequest from "../../middlewares/validateRequest";
import { accountValidations } from "./account.validation";

const router = express.Router();
router.get(
  "/my-account",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  accountControllers.getMyAccount,
);

router.post(
  "/create-account",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  validateRequest(accountValidations.createAccountValidation),
  accountControllers.createAccount,
);
router.get(
  "/",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  accountControllers.getAccounts,
);
router.get(
  "/:id",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  accountControllers.getEachAccount,
);
router.patch(
  "/:id",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  accountControllers.updateAccount,
);
router.patch(
  "/update-status/:id",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  accountControllers.updateAccountStatusOrInterest,
);
router.delete(
  "/:id",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  accountControllers.deleteAccount,
);

export const accountRoutes = router;
