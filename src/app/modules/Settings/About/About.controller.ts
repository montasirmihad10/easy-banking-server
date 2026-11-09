import HttpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { TJwtUser } from "../../../interface/global";
import { aboutServices } from "./About.service";

const getAbout = catchAsync(async (req, res) => {
  const result = await aboutServices.getAbout();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "About retrieved successfully",
    data: result,
  });
});

const updateAbout = catchAsync(async (req, res) => {
  const result = await aboutServices.upsertAbout(
    req.body,
    req.user as TJwtUser,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "About updated successfully",
    data: result,
  });
});

export const aboutControllers = {
  getAbout,
  updateAbout,
};
