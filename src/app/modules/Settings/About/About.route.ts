import express from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLE } from "../../../interface/global";
import { aboutControllers } from "./About.controller";

const router = express.Router();

router.get("/", aboutControllers.getAbout);
router.patch("/", auth(USER_ROLE.admin), aboutControllers.updateAbout);

export const AboutRoutes = router;
