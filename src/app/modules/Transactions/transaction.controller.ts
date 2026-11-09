import HttpStatus from "http-status";
import { TJwtUser } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { getParam } from "../../utils/getParam";
import { transactionServices } from "./transaction.service";
import { TransactionModel } from "./transaction.model";

const createDeposit = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await transactionServices.createDeposit(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Deposit checkout session created successfully",
    data: result,
  });
});

const createWithdraw = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await transactionServices.createWithdraw(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message:
      "Withdrawal request submitted. Waiting for admin/manager approval.",
    data: result,
  });
});

const reviewWithdraw = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const id = getParam(req, "id");
  const action = (req.body?.action || "").toLowerCase() as "approve" | "reject";

  const result = await transactionServices.reviewWithdraw(user, id, action);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message:
      action === "approve"
        ? "Withdrawal approved successfully"
        : "Withdrawal rejected and amount refunded",
    data: result,
  });
});

const createTransfer = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await transactionServices.createTransfer(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Transfer completed succesfully",
    data: result,
  });
});

const getTransactions = catchAsync(async (req, res) => {
  const result = await transactionServices.getTransactions(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Transfer retrieved succesfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEachTransactions = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const user = req.user as TJwtUser;
  const result = await transactionServices.getEachTransactions(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Transaction retrieved successfully",
    data: result,
  });
});

const getPersonalTransactions = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await transactionServices.getPersonalTransactions(
    user,
    req.query,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Transfer retrieved succesfully",
    meta: result.meta,
    data: result.result,
  });
});

const getStripeSuccesSession = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await transactionServices.getStripeSuccesSession(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "getStripeSuccesSession retrieved succesfully",
    data: result,
  });
});

const downloadTransaction = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const user = req.user as TJwtUser;
  const pdfBuffer = await transactionServices.downloadTransaction(id, user);
  const isTransactionExist = await TransactionModel.findById(id);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=transaction-${isTransactionExist?.transaction_Id || id}.pdf`,
  );
  res.send(pdfBuffer);
});

export const transactionControllers = {
  createDeposit,
  createWithdraw,
  reviewWithdraw,
  createTransfer,
  getTransactions,
  getPersonalTransactions,
  getEachTransactions,
  downloadTransaction,
  getStripeSuccesSession,
};
