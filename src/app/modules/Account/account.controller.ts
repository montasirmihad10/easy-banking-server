import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { getParam } from "../../utils/getParam";
import { accountServices } from "./account.service";
import { TJwtUser } from "../../interface/global";

const createAccount = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await accountServices.createAccount(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Account created succesfully",
    data: result,
  });
});

const getAccounts = catchAsync(async (req, res) => {
  const result = await accountServices.getAccounts(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Accounts retrieved succesfully",
    meta: result.meta,
    data: result.result,
  });
});

const getMyAccount = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await accountServices.getMyAccount(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Account retrieved succesfully",
    data: result,
  });
});

const getEachAccount = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const user = req.user as TJwtUser;
  const result = await accountServices.getEachAccount(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Account retrieved succesfully",
    data: result,
  });
});

const updateAccount = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await accountServices.updateAccount(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Account updated succesfully",
    data: result,
  });
});

const updateAccountStatusOrInterest = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await accountServices.updateAccountStatusOrInterest(
    id,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Account updated succesfully",
    data: result,
  });
});

const deleteAccount = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await accountServices.deleteAccount(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Account deleted succesfully",
    data: result,
  });
});

export const accountControllers = {
  createAccount,
  getAccounts,
  getEachAccount,
  updateAccount,
  updateAccountStatusOrInterest,
  deleteAccount,
  getMyAccount,
};
