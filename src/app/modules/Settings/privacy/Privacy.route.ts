import express from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLE } from "../../../interface/global";
import { privacyControllers } from "./Privacy.controller";

const router = express.Router();

router.get("/", privacyControllers.getPrivacy);
router.patch("/", auth(USER_ROLE.admin), privacyControllers.updatePrivacy);

export const PrivacyRoutes = router;
