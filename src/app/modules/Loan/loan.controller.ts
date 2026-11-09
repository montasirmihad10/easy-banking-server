import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { getParam } from "../../utils/getParam";
import { loadServices } from "./loan.service";
import { TJwtUser } from "../../interface/global";

const requestLoan = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await loadServices.requestLoan(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Loan requested succesfully",
    data: result,
  });
});

const updateRequestedLoan = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await loadServices.updateRequestedLoan(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Loan approved and updated succesfully",
    data: result,
  });
});

const payLoan = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const user = req.user as TJwtUser;
  const result = await loadServices.payLoan(id, user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Loan payment checkout created successfully",
    data: result,
  });
});

const getLoans = catchAsync(async (req, res) => {
  const result = await loadServices.getLoans(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Loans retrieved succesfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEachLoans = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const user = req.user as TJwtUser;
  const result = await loadServices.getEachLoans(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Loans retrieved succesfully",
    data: result,
  });
});

const myLoan = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const id = user?.user.toString();
  const result = await loadServices.myLoan(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Loan retrieved succesfully",
    data: result,
  });
});

export const loanControllers = {
  requestLoan,
  updateRequestedLoan,
  payLoan,
  getLoans,
  getEachLoans,
  myLoan,
};
