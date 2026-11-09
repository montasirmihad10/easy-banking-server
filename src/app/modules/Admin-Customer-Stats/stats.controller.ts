import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { statServices } from "./adminStats.service";
import { customerStatServices } from "./customerStats.service";
import { TJwtUser } from "../../interface/global";

const getAdminStats = catchAsync(async (req, res) => {
  const result = await statServices.getAdminStats();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Admin stats retrieved succesfully",
    // meta: result.meta,
    data: result,
  });
});

const getLastMonthStats = catchAsync(async (req, res) => {
  const result = await statServices.getLastMonthStats();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Last month stats retrieved succesfully",
    // meta: result.meta,
    data: result,
  });
});

const getBankDetails = catchAsync(async (req, res) => {
  const result = await statServices.getBankDetails();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Bank details retrieved succesfully",
    // meta: result.meta,
    data: result,
  });
});

const getCustomerStats = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await customerStatServices.getCustomerStats(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Customer stats retrieved succesfully",
    // meta: result.meta,
    data: result,
  });
});

const getAdditionalCustomerStats = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await customerStatServices.getAdditionalCustomerStats(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Customer stats retrieved succesfully",
    // meta: result.meta,
    data: result,
  });
});

export const statControllers = {
  getAdminStats,
  getLastMonthStats,
  getBankDetails,
  getCustomerStats,
  getAdditionalCustomerStats,
};
