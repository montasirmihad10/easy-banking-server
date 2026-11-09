import express from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLE } from "../../../interface/global";
import { termsControllers } from "./Terms.controller";

const router = express.Router();

router.get("/", termsControllers.getTerms);
router.patch("/", auth(USER_ROLE.admin), termsControllers.updateTerms);

export const TermsRoutes = router;
