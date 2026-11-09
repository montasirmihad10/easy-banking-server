import PDFDocument from "pdfkit";
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { AccountModel } from "../Account/account.model";
import { TTransaction } from "./transaction.interface";
import mongoose, { Types } from "mongoose";
import { TransactionModel } from "./transaction.model";
import { generateTransactionId } from "./transaction.utils";
import { TJwtUser } from "../../interface/global";
import { User } from "../User/user.model";
import { createPayment } from "../../utils/stripePayment";
import { PassThrough } from "stream";
import dayjs from "dayjs";
import { TBranch } from "../Branches/branch.interface";
import { TBankAccount } from "../Account/account.interface";
import QueryBuilder from "../../builder/QueryBuilder";
import { BranchModel } from "../Branches/branch.model";
import { getBankSettings } from "../Settings/settings.service";
import {
  notifyStaff,
  sendNotification,
} from "../Notification/notification.utils";

type LoanWithBranchPopulated = TBankAccount & {
  branch: TBranch | Types.ObjectId;
};

const searchTransaction = [
  "account",
  "transactionType",
  "fromAccount",
  "toAccount",
  "transaction_Id",
  "description",
];

const createDeposit = async (user: TJwtUser, payload: TTransaction) => {
  const isUserExist = await User.findById(user?.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }

  const isAccountExist = await AccountModel.findOne({
    accountNumber: payload.account,
    user: user?.user,
  });
  if (!isAccountExist) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "The account Number is invalid or not matching your Identity",
    );
  }
  if (isAccountExist.status !== "active") {
    throw new AppError(HttpStatus.BAD_REQUEST, "Your account is not active yet");
  }
  if (!payload.amount || payload.amount <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Please enter a valid amount");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const transaction_Id = await generateTransactionId("deposit");
    const [created] = await TransactionModel.create(
      [
        {
          ...payload,
          transactionType: "deposit",
          transaction_Id,
          user: isAccountExist.user,
          status: "pending",
          account: payload.account,
          description: payload.description || "Card deposit via Stripe",
        },
      ],
      { session },
    );

    if (!created) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Transaction creation failed");
    }

    const metaData = {
      transactionType: "deposit",
      amount: payload.amount.toString(),
      accountNumber: payload.account || "",
      user: isAccountExist.user.toString(),
      description: payload.description || "",
      transactionId: created._id.toString(),
      role: user?.role?.toString() || "customer",
    };

    const payment = await createPayment(
      payload.amount,
      isUserExist.email,
      metaData,
    );

    await TransactionModel.findByIdAndUpdate(
      created._id,
      { stripeSessionId: payment.sessionId },
      { session },
    );

    await session.commitTransaction();
    return payment.url;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) throw error;
    throw new AppError(HttpStatus.BAD_REQUEST, "Deposit checkout failed");
  } finally {
    await session.endSession();
  }
};

/**
 * Withdrawal = funds hold + pending request.
 * Admin/manager must approve (complete) or reject (refund hold).
 */
const createWithdraw = async (user: TJwtUser, payload: TTransaction) => {
  const isUserExist = await User.findById(user?.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }

  const isAccountExist = await AccountModel.findOne({
    accountNumber: payload.account,
    user: isUserExist._id,
  });
  if (!isAccountExist) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "The account Number is invalid or not matching your Identity",
    );
  }
  if (isAccountExist.status !== "active") {
    throw new AppError(HttpStatus.BAD_REQUEST, "Your account is not active yet");
  }
  if (!payload.amount || payload.amount <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Please enter a valid amount");
  }

  const settings = await getBankSettings();
  const amount = Number(payload.amount);
  const minimumBalance = Number(isAccountExist.minimumBalance || 0);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const monthlyCount = await TransactionModel.countDocuments({
    account: payload.account,
    transactionType: "withdraw",
    status: { $in: ["pending", "completed"] },
    createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
  });
  if (monthlyCount >= settings.withdrawMaxPerMonth) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Monthly withdrawal limit of ${settings.withdrawMaxPerMonth} already reached`,
    );
  }

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  const todaysTransactions = await TransactionModel.find({
    account: payload.account,
    transactionType: "withdraw",
    status: { $in: ["pending", "completed"] },
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  if (todaysTransactions.length >= settings.withdrawMaxPerDay) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `You cannot withdraw more than ${settings.withdrawMaxPerDay} times in 24 hours`,
    );
  }

  const totalAmount = todaysTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  if (
    isAccountExist.accountType === "checking" &&
    totalAmount + amount > settings.checkingWithdrawDailyAmountLimit
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Checking accounts can withdraw max ${settings.checkingWithdrawDailyAmountLimit} ${settings.currency}/day. Remaining today: ${Math.max(0, settings.checkingWithdrawDailyAmountLimit - totalAmount)}`,
    );
  }
  if (
    isAccountExist.accountType === "business" &&
    totalAmount + amount > settings.businessWithdrawDailyAmountLimit
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Business accounts can withdraw max ${settings.businessWithdrawDailyAmountLimit} ${settings.currency}/day. Remaining today: ${Math.max(0, settings.businessWithdrawDailyAmountLimit - totalAmount)}`,
    );
  }
  if (
    isAccountExist.accountType === "savings" &&
    settings.savingsWithdrawDailyAmountLimit != null &&
    totalAmount + amount > settings.savingsWithdrawDailyAmountLimit
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Savings accounts can withdraw max ${settings.savingsWithdrawDailyAmountLimit} ${settings.currency}/day`,
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomic hold: only succeeds if enough balance remains after min balance
    const updatedAccount = await AccountModel.findOneAndUpdate(
      {
        accountNumber: payload.account,
        status: "active",
        balance: { $gte: amount + minimumBalance },
      },
      { $inc: { balance: -amount } },
      { session, new: true },
    );

    if (!updatedAccount) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Insufficient balance or minimum balance requirement not met",
      );
    }

    if (updatedAccount.branch) {
      await BranchModel.findByIdAndUpdate(
        updatedAccount.branch,
        { $inc: { reserevedBalance: -amount } },
        { session },
      );
    }

    const transaction_Id = await generateTransactionId("withdraw");
    const [created] = await TransactionModel.create(
      [
        {
          account: payload.account,
          user: isAccountExist.user,
          transactionType: "withdraw",
          transaction_Id,
          amount,
          status: "pending",
          description:
            payload.description ||
            "Withdrawal request pending admin/manager approval",
          fromAccount: payload.account,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    void notifyStaff({
      type: "alert",
      title: "Withdrawal request",
      message: `${isUserExist.name?.firstName || "A customer"} requested a withdrawal of ${amount}.`,
      data: { transactionId: created?._id, account: payload.account },
    });
    return created;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  } finally {
    await session.endSession();
  }
};

const reviewWithdraw = async (
  reviewer: TJwtUser,
  id: string,
  action: "approve" | "reject",
) => {
  if (action !== "approve" && action !== "reject") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "action must be approve or reject",
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Claim the pending withdrawal atomically to prevent approve+reject races.
    const nextStatus = action === "approve" ? "completed" : "rejected";
    const txn = await TransactionModel.findOneAndUpdate(
      {
        _id: id,
        transactionType: "withdraw",
        status: "pending",
      },
      {
        status: nextStatus,
        reviewedBy: reviewer.user,
        reviewedAt: new Date(),
      },
      { session, new: true },
    );

    if (!txn) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Pending withdrawal request not found",
      );
    }

    if (action === "approve") {
      txn.description = txn.description
        ? `${txn.description} | Approved`
        : "Withdrawal approved";
      await txn.save({ session });
      await session.commitTransaction();
      if (txn.user) {
        void sendNotification({
          recipientId: txn.user,
          senderId: reviewer.user,
          type: "transaction",
          title: "Withdrawal approved",
          message: `Your withdrawal of ${txn.amount} was approved.`,
          data: { transactionId: txn._id },
        });
      }
      return txn;
    }

    // Reject → refund the hold only after we claimed the pending txn
    const refunded = await AccountModel.findOneAndUpdate(
      { accountNumber: txn.account },
      { $inc: { balance: txn.amount } },
      { session, new: true },
    );
    if (!refunded) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Failed to refund hold");
    }
    if (refunded.branch) {
      await BranchModel.findByIdAndUpdate(
        refunded.branch,
        { $inc: { reserevedBalance: txn.amount } },
        { session },
      );
    }

    txn.description = txn.description
      ? `${txn.description} | Rejected & refunded`
      : "Withdrawal rejected and refunded";
    await txn.save({ session });

    await session.commitTransaction();
    if (txn.user) {
      void sendNotification({
        recipientId: txn.user,
        senderId: reviewer.user,
        type: "transaction",
        title: "Withdrawal rejected",
        message: `Your withdrawal of ${txn.amount} was rejected and refunded.`,
        data: { transactionId: txn._id },
      });
    }
    return txn;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  } finally {
    await session.endSession();
  }
};

const createTransfer = async (user: TJwtUser, payload: TTransaction) => {
  if (!payload.fromAccount || !payload.toAccount) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Both fromAccount and toAccount are required",
    );
  }
  if (payload.fromAccount === payload.toAccount) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Please enter valid account numbers",
    );
  }

  const isUserExist = await User.findById(user?.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }

  const isFromAccountExist = await AccountModel.findOne({
    accountNumber: payload.fromAccount,
    user: isUserExist._id,
  });
  if (!isFromAccountExist) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "Your account Number is invalid or not matching your Identity",
    );
  }

  const isToAccountExist = await AccountModel.findOne({
    accountNumber: payload.toAccount,
  });
  if (!isToAccountExist) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "The receiver account Number is invalid",
    );
  }

  if (isFromAccountExist.status !== "active") {
    throw new AppError(HttpStatus.BAD_REQUEST, "Your account is not active yet");
  }
  if (isToAccountExist.status !== "active") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The other account is not active yet",
    );
  }
  if (!payload.amount || payload.amount <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Please enter a valid amount");
  }

  const settings = await getBankSettings();
  const amount = Number(payload.amount);
  const minimumBalance = Number(isFromAccountExist.minimumBalance || 0);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyTransfered = await TransactionModel.aggregate([
    {
      $match: {
        fromAccount: isFromAccountExist.accountNumber,
        transactionType: "transfer",
        status: "completed",
        createdAt: { $gte: startOfDay },
      },
    },
    { $group: { _id: null, totalTransfered: { $sum: "$amount" } } },
  ]);
  const totalTransferred = dailyTransfered[0]?.totalTransfered || 0;

  if (isFromAccountExist.accountType === "checking") {
    if (totalTransferred + amount > settings.checkingTransferDailyAmountLimit) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `Checking accounts can only transfer ${settings.checkingTransferDailyAmountLimit} ${settings.currency} per day`,
      );
    }
    const perDayTransfers = await TransactionModel.countDocuments({
      fromAccount: payload.fromAccount,
      transactionType: "transfer",
      status: "completed",
      createdAt: { $gte: startOfDay },
    });
    if (perDayTransfers >= settings.checkingTransferDailyCountLimit) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `Checking accounts can make only ${settings.checkingTransferDailyCountLimit} transfers per day`,
      );
    }
  }
  if (
    isFromAccountExist.accountType === "business" &&
    totalTransferred + amount > settings.businessTransferDailyAmountLimit
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Business accounts can only transfer ${settings.businessTransferDailyAmountLimit} ${settings.currency} per day`,
    );
  }
  if (
    isFromAccountExist.accountType === "savings" &&
    settings.savingsTransferDailyAmountLimit != null &&
    totalTransferred + amount > settings.savingsTransferDailyAmountLimit
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Savings accounts can only transfer ${settings.savingsTransferDailyAmountLimit} ${settings.currency} per day`,
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const debited = await AccountModel.findOneAndUpdate(
      {
        accountNumber: payload.fromAccount,
        status: "active",
        balance: { $gte: amount + minimumBalance },
      },
      { $inc: { balance: -amount } },
      { session, new: true },
    );
    if (!debited) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Insufficient balance or minimum balance requirement not met",
      );
    }

    const credited = await AccountModel.findOneAndUpdate(
      {
        accountNumber: payload.toAccount,
        status: "active",
      },
      { $inc: { balance: amount } },
      { session, new: true },
    );
    if (!credited) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Receiver account balance update failed",
      );
    }

    const transaction_Id = await generateTransactionId("transfer");
    const [created] = await TransactionModel.create(
      [
        {
          account: payload.fromAccount,
          user: isFromAccountExist.user,
          transactionType: "transfer",
          transaction_Id,
          amount,
          fromAccount: payload.fromAccount,
          toAccount: payload.toAccount,
          status: "completed",
          description: payload.description || "Internal transfer",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    void sendNotification({
      recipientId: isFromAccountExist.user,
      type: "transaction",
      title: "Transfer sent",
      message: `You transferred ${amount} to ${payload.toAccount}.`,
      data: { transactionId: created?._id },
    });
    if (credited?.user) {
      void sendNotification({
        recipientId: credited.user,
        type: "transaction",
        title: "Transfer received",
        message: `You received ${amount} from ${payload.fromAccount}.`,
        data: { transactionId: created?._id },
      });
    }
    return created;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  } finally {
    await session.endSession();
  }
};

const getTransactions = async (query: Record<string, unknown>) => {
  const transactionQuery = new QueryBuilder(
    TransactionModel.find().populate("user"),
    query,
  )
    .search(searchTransaction)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await transactionQuery.countTotal();
  const result = await transactionQuery.modelQuery;
  return { meta, result };
};

const getEachTransactions = async (id: string, user: TJwtUser) => {
  const result = await TransactionModel.findById(id).populate("user");
  if (!result) {
    throw new AppError(HttpStatus.NOT_FOUND, "Transaction not found");
  }
  if (user.role === "customer") {
    const owner =
      result.user &&
      typeof result.user === "object" &&
      "_id" in (result.user as object)
        ? String((result.user as { _id: unknown })._id)
        : String(result.user);
    if (owner !== String(user.user)) {
      throw new AppError(HttpStatus.FORBIDDEN, "Not authorized");
    }
  }
  return result;
};

const getPersonalTransactions = async (
  user: TJwtUser,
  query: Record<string, unknown>,
) => {
  if (!user || !user.email) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "You are unauthorized");
  }
  const isUserExist = await User.findOne({
    role: user.role,
    email: user.email,
  });
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }

  const transactionQuery = new QueryBuilder(
    TransactionModel.find({ user: isUserExist._id }).sort({ createdAt: -1 }),
    query,
  )
    .search(searchTransaction)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await transactionQuery.countTotal();
  const result = await transactionQuery.modelQuery;
  return { meta, result };
};

export const downloadTransaction = async (id: string, user: TJwtUser) => {
  const isUserTransaction =
    await TransactionModel.findById(id).populate("user");
  if (!isUserTransaction) {
    throw new AppError(HttpStatus.NOT_FOUND, "Transaction not found");
  }

  const isAccountExist = (await AccountModel.findOne({
    accountNumber: isUserTransaction.account,
    user: isUserTransaction.user,
  })
    .populate("branch")
    .select("branch user accountHolderName")) as LoanWithBranchPopulated;
  if (!isAccountExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Bank account not found");
  }

  const isUserExist = await User.findOne({ _id: isAccountExist?.user });
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  if (
    user.role === "customer" &&
    isUserTransaction?.user?._id?.toString() !== user?.user?.toString()
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not authorized to download this transaction",
    );
  }

  const branch = isAccountExist.branch as TBranch;
  const doc = new PDFDocument();
  const stream = new PassThrough();
  const buffers: Uint8Array[] = [];

  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => stream.end());

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("Easy Bank Ltd.", { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(14)
    .text("Transaction Receipt", { align: "center" });
  doc.moveDown();

  doc.font("Helvetica-Bold").fontSize(12).text("Branch:", { continued: true });
  doc.font("Helvetica").text(` ${branch?.name}`);
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  const addField = (label: string, value: string | number | null) => {
    doc.font("Helvetica-Bold").text(`${label}:`, { continued: true });
    doc.font("Helvetica").text(` ${value ?? "N/A"}`);
    doc.moveDown(0.3);
  };

  addField("Transaction ID", isUserTransaction.transaction_Id as string);
  addField("Date", dayjs(isUserTransaction.createdAt).format("YYYY-MM-DD"));
  addField("Type", isUserTransaction.transactionType);
  addField("Amount", `BDT-${isUserTransaction.amount}`);
  addField("Status", isUserTransaction.status || "N/A");
  addField("From", (isUserTransaction.fromAccount as string) || "N/A");
  addField("To", (isUserTransaction.toAccount as string) || "N/A");

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  addField("Customer", isAccountExist.accountHolderName as string);
  addField("Email", isUserExist.email);
  addField("Description", isUserTransaction.description || "N/A");

  doc.moveDown(2);
  doc
    .font("Helvetica-Bold")
    .text("Thank you for banking with us.", { align: "center" });
  doc.moveDown(1);
  doc.font("Helvetica").text("Authorized by Easy Bank", { align: "right" });

  doc.end();
  await new Promise((resolve) => doc.on("end", resolve));
  return Buffer.concat(buffers);
};

const getStripeSuccesSession = async (id: string) => {
  const result = await TransactionModel.findById(id);
  if (!result) {
    throw new AppError(HttpStatus.NOT_FOUND, "Transaction not found");
  }
  return result;
};

export const transactionServices = {
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
