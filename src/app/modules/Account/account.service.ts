/* eslint-disable @typescript-eslint/no-unused-vars */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { User } from "../User/user.model";
import { TBankAccount } from "./account.interface";
import { AccountModel } from "./account.model";
import { generateSavingAccountNumber } from "./account.utils";
import { BranchModel } from "../Branches/branch.model";
import { ACCOUNT_TYPE, TJwtUser } from "../../interface/global";
import QueryBuilder from "../../builder/QueryBuilder";
import { searchAccount } from "./account.const";
import { sendEmail } from "../../utils/sendEmail";
import { getBankSettings } from "../Settings/settings.service";
import {
  notifyStaff,
  sendNotification,
} from "../Notification/notification.utils";

const createAccount = async (user: TJwtUser, payload: TBankAccount) => {
  const settings = await getBankSettings();
  const isBranchExist = await BranchModel.findById(payload?.branch);
  if (!isBranchExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The branch is not found");
  }

  const isUserExist = await User.findById(user?.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }
  const isAccountExist = await AccountModel.findOne({ user: isUserExist._id });
  if (isAccountExist && settings.oneAccountPerUser) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The user already have an account",
    );
  }

  // Customers self-apply; staff must activate. Never trust client money/status fields.
  const accountPayload: Partial<TBankAccount> = {
    branch: payload.branch,
    accountType: payload.accountType,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    address: payload.address,
    city: payload.city,
    postalCode: payload.postalCode,
    country: payload.country,
    branchCode: isBranchExist?.code,
    user: isUserExist._id,
    accountHolderName: `${isUserExist.name?.firstName} ${isUserExist.name?.lastName}`,
    currency: settings.currency || "BDT",
    balance: 0,
    minimumBalance: settings.defaultMinimumBalance,
    status: "pending",
  };
  accountPayload.accountNumber = await generateSavingAccountNumber({
    ...accountPayload,
    accountType: accountPayload.accountType,
  } as TBankAccount);

  const result = await AccountModel.create(accountPayload);
  if (result) {
    const subject = `EasyBank ~ Account application received`;
    const html = `Hi ${result.accountHolderName}, your EasyBank account <h3>${result.accountNumber}</h3> is pending staff approval. You will be notified when it becomes active.`;
    await sendEmail(isUserExist.email, subject, html);
    void notifyStaff({
      type: "account",
      title: "New account application",
      message: `${result.accountHolderName} applied for a ${result.accountType || "bank"} account.`,
      data: { accountNumber: result.accountNumber },
    });
  }
  return result;
};

const getAccounts = async (query: Record<string, unknown>) => {
  const accountQuery = new QueryBuilder(
    AccountModel.find().sort({ createdAt: 1 }).populate("user branch"),
    query,
  )
    .search(searchAccount)
    .filter()
    .sort()
    .paginate()
    .fields();
  const meta = await accountQuery.countTotal();
  const result = await accountQuery.modelQuery;
  return { meta, result };
};

const getMyAccount = async (user: TJwtUser) => {
  const account = await AccountModel.findOne({
    user: user?.user,
  }).populate("user branch");
  if (!account) {
    throw new AppError(HttpStatus.NOT_FOUND, "You dont have an account");
  }
  return account;
};

const getEachAccount = async (id: string, user: TJwtUser) => {
  const account = await AccountModel.findById(id).populate("user branch");
  if (!account) {
    throw new AppError(HttpStatus.NOT_FOUND, "Account not found");
  }

  if (["admin", "manager"].includes(user.role)) {
    return account;
  }
  if (account.user._id.toString() === user?.user.toString()) {
    return account;
  }
  throw new AppError(
    HttpStatus.FORBIDDEN,
    "You are not authorized to access this account",
  );
};

const updateAccount = async (id: string, payload: Partial<TBankAccount>) => {
  const isAccountExist = await AccountModel.findById(id);
  if (!isAccountExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The account is not found");
  }
  const isUserExist = await User.findById(isAccountExist?.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The User is not found");
  }

  const settings = await getBankSettings();

  // Remove immutable / money-mint / status fields unless explicitly allowed
  const {
    accountType: _accountType,
    branchCode: _branchCode,
    accountNumber: _accountNumber,
    balance,
    status: _status,
    user: _user,
    ...safeUpdateData
  } = payload;
  void _accountType;
  void _branchCode;
  void _accountNumber;
  void _status;
  void _user;

  const updateData: Partial<TBankAccount> = { ...safeUpdateData };

  if (settings.allowAdminDirectBalanceEdit && balance !== undefined) {
    if (Number(balance) < Number(isAccountExist.minimumBalance)) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `You must maintain a minimum balance of ${isAccountExist.minimumBalance} in your account`,
      );
    }
    updateData.balance = balance;
  }

  if (
    updateData.minimumBalance !== undefined &&
    Number(updateData.minimumBalance) < 0
  ) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Minimum balance cannot be negative");
  }

  const result = await AccountModel.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return result;
};

const updateAccountStatusOrInterest = async (
  id: string,
  payload: Partial<{
    status: "active" | "closed" | "suspended" | "pending";
    interestRate: number;
  }>,
) => {
  const isAccountExist = await AccountModel.findOne({ accountNumber: id });
  if (!isAccountExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The account is not found");
  }
  const isUserExist = await User.findById(isAccountExist?.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The User is not found");
  }
  const isBranchExist = await BranchModel.findById(isAccountExist?.branch);
  if (!isBranchExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The branch is not found");
  }

  const settings = await getBankSettings();
  const update: Record<string, unknown> = {};
  if (payload.status) update.status = payload.status;
  if (payload.interestRate != null) update.interestRate = payload.interestRate;

  // Credit opening balance only when staff first activates a pending account.
  const activating =
    isAccountExist.status === "pending" && payload.status === "active";
  if (activating) {
    const opening = Number(settings.defaultOpeningBalance || 0);
    if (opening > 0) {
      update.balance = opening;
      if (Number(isBranchExist.reserevedBalance || 0) < opening) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Branch does not have enough reserved balance for opening credit",
        );
      }
      await BranchModel.findByIdAndUpdate(isBranchExist._id, {
        $inc: { reserevedBalance: -opening, usedBalance: opening },
      });
    }
  }

  const result = await AccountModel.findOneAndUpdate(
    { accountNumber: id },
    { $set: update },
    { new: true },
  );
  if (activating && result?.user) {
    void sendNotification({
      recipientId: result.user,
      type: "account",
      title: "Account activated",
      message: `Your EasyBank account ${result.accountNumber} is now active.`,
      data: { accountNumber: result.accountNumber },
    });
  }
  return result;
};

const deleteAccount = async (id: string) => {
  const isAccountExist = await AccountModel.findById(id);
  if (!isAccountExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The account is not found");
  }
  if (isAccountExist?.isDeleted) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The account is already deleted",
    );
  }

  const result = await AccountModel.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  return result;
};

export const accountServices = {
  createAccount,
  getAccounts,
  getEachAccount,
  updateAccount,
  updateAccountStatusOrInterest,
  deleteAccount,
  getMyAccount,
};
