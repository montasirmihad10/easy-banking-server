import express from "express";
import { typeControllers } from "./type.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../interface/global";

const router = express.Router();

router.get("/", typeControllers.getTypes);
router.get("/:id", typeControllers.getEachTypes);
router.patch(
  "/:id",
  auth(USER_ROLE.admin),
  typeControllers.updateType,
);

export const typeRoutes = router;
