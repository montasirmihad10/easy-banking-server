import HttpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { TJwtUser } from "../../../interface/global";
import { termsServices } from "./Terms.service";

const getTerms = catchAsync(async (req, res) => {
  const result = await termsServices.getTerms();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Terms retrieved successfully",
    data: result,
  });
});

const updateTerms = catchAsync(async (req, res) => {
  const result = await termsServices.upsertTerms(
    req.body,
    req.user as TJwtUser,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Terms updated successfully",
    data: result,
  });
});

export const termsControllers = {
  getTerms,
  updateTerms,
};
