import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../interface/global";
import validateRequest from "../../middlewares/validateRequest";
import { uploadImage } from "../../utils/sendImageToCloudinary";
import { settingsControllers } from "./settings.controller";
import { updateSettingsValidation } from "./settings.validation";

const router = express.Router();

router.get("/", settingsControllers.getSettings);

router.get(
  "/admin",
  auth(USER_ROLE.admin),
  settingsControllers.getAdminSettings,
);

router.patch(
  "/",
  auth(USER_ROLE.admin),
  validateRequest(updateSettingsValidation),
  settingsControllers.updateSettings,
);

router.post(
  "/upload-image",
  auth(USER_ROLE.admin),
  uploadImage.single("image"),
  settingsControllers.uploadWebsiteImage,
);

export const settingsRoutes = router;
