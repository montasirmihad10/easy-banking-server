import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../interface/global";
import { loanControllers } from "./loan.controller";

const router = express.Router();

router.get(
  "/my-loan",
  auth(USER_ROLE.customer, USER_ROLE.manager),
  loanControllers.myLoan,
);
router.post(
  "/request-loan",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  //   validateRequest(branchValidations.createBranchValidation),
  loanControllers.requestLoan,
);
router.patch(
  "/update-requested-loan/:id",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  loanControllers.updateRequestedLoan,
);
router.patch(
  "/pay-loan/:id",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  //   validateRequest(branchValidations.createBranchValidation),
  loanControllers.payLoan,
);
router.get(
  "/",
  auth(USER_ROLE.admin, USER_ROLE.manager),
  loanControllers.getLoans,
);
router.get(
  "/:id",
  auth(USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.customer),
  loanControllers.getEachLoans,
);

export const loanRoutes = router;
