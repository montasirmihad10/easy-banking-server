import HttpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { TJwtUser } from "../../../interface/global";
import { privacyServices } from "./Privacy.service";

const getPrivacy = catchAsync(async (req, res) => {
  const result = await privacyServices.getPrivacy();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Privacy retrieved successfully",
    data: result,
  });
});

const updatePrivacy = catchAsync(async (req, res) => {
  const result = await privacyServices.upsertPrivacy(
    req.body,
    req.user as TJwtUser,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Privacy updated successfully",
    data: result,
  });
});

export const privacyControllers = {
  getPrivacy,
  updatePrivacy,
};
