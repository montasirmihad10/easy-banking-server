import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { User } from "../User/user.model";
import { TJwtUser } from "./../../interface/global";
import { TLoan } from "./loan.interface";
import { AccountModel } from "../Account/account.model";
import { BranchModel } from "../Branches/branch.model";
import { LoanModel } from "./loan.model";
import dayjs from "dayjs";
import mongoose, { Types } from "mongoose";
import { TransactionModel } from "../Transactions/transaction.model";
import { generateTransactionId } from "../Transactions/transaction.utils";
import { createPayment } from "../../utils/stripePayment";
import { TBranch } from "../Branches/branch.interface";
import QueryBuilder from "../../builder/QueryBuilder";
import { getBankSettings } from "../Settings/settings.service";
import {
  notifyStaff,
  sendNotification,
} from "../Notification/notification.utils";

type LoanWithBranchPopulated = TLoan & {
  branch: TBranch | Types.ObjectId;
  _id: Types.ObjectId;
};

const searchLoans = ["accountNumber"];

const requestLoan = async (user: TJwtUser, payload: TLoan) => {
  const isUserExist = await User.findById(user?.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }
  const isAccountExist = await AccountModel.findOne({ user: isUserExist._id });
  if (!isAccountExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The users Account is not found");
  }
  if (isAccountExist.status !== "active") {
    throw new AppError(HttpStatus.BAD_REQUEST, "Account is not active");
  }

  const isBranchExist = await BranchModel.findById(payload.branch);
  if (!isBranchExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The branch is not found");
  }

  if (!payload.loanAmount || payload.loanAmount <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid loan amount");
  }

  const settings = await getBankSettings();

  // Block if open loan count exceeds settings
  const openLoanCount = await LoanModel.countDocuments({
    user: isUserExist._id,
    status: { $in: ["pending", "approved", "active"] },
  });
  if (openLoanCount >= settings.maxOpenLoansPerUser) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "You already have an unpaid / pending loan",
    );
  }

  payload.user = isUserExist._id;
  payload.account = isAccountExist._id;
  payload.accountNumber = isAccountExist.accountNumber;
  payload.status = "pending";
  // Never trust client interest rates — bank settings control pricing.
  payload.interestRate = settings.defaultLoanInterestRate;
  const termInMonths = payload.term;
  payload.endDate = dayjs(payload.startDate)
    .add(termInMonths as number, "month")
    .toDate();

  const loan = await LoanModel.create(payload);
  void notifyStaff({
    type: "loan",
    title: "New loan request",
    message: `${isUserExist.name?.firstName || "A customer"} requested a loan of ${payload.loanAmount}.`,
    data: { loanId: loan._id },
  });
  return loan;
};

/**
 * Disburse only on pending → approved (one-time).
 * Rejects / other statuses do not touch money.
 */
const updateRequestedLoan = async (id: string, payload: Partial<TLoan>) => {
  const isLoanExist = (await LoanModel.findById(id).populate(
    "branch",
  )) as LoanWithBranchPopulated | null;
  if (!isLoanExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The Loan request is not found");
  }

  const nextStatus = payload.status;
  if (!nextStatus) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Status is required");
  }

  // Non-approval transitions — only pending → rejected (no money movement)
  if (nextStatus !== "approved") {
    if (nextStatus !== "rejected") {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Only approved or rejected status updates are allowed",
      );
    }
    if (isLoanExist.status !== "pending") {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Only pending loans can be rejected",
      );
    }
    const rejected = await LoanModel.findOneAndUpdate(
      { _id: id, status: "pending" },
      { status: "rejected" },
      { new: true },
    );
    if (rejected?.user) {
      void sendNotification({
        recipientId: rejected.user,
        type: "loan",
        title: "Loan rejected",
        message: "Your loan request was rejected.",
        data: { loanId: rejected._id },
      });
    }
    return rejected;
  }

  // Approval path — must currently be pending
  if (isLoanExist.status !== "pending") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Loan cannot be approved from status "${isLoanExist.status}"`,
    );
  }

  const isAccountExist = await AccountModel.findOne({
    user: isLoanExist.user,
    accountNumber: isLoanExist.accountNumber,
  });
  if (!isAccountExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The users Account is not found");
  }

  const settings = await getBankSettings();
  const loanAmount = Number(isLoanExist.loanAmount);
  const term = Number(payload.term || isLoanExist.term);
  const interestRate = Number(
    payload.interestRate ??
      isLoanExist.interestRate ??
      settings.defaultLoanInterestRate,
  );
  const startDate = payload.startDate
    ? dayjs(payload.startDate).toDate()
    : dayjs(isLoanExist.startDate).toDate();
  const endDate = dayjs(startDate).add(term, "month").endOf("month").toDate();
  const totalInterest = loanAmount * interestRate;
  const totalPayable = Math.round(loanAmount + totalInterest);
  const monthlyDue = Math.ceil(totalPayable / term);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomic transition pending → active (approved+disbursed)
    const updateLoan = await LoanModel.findOneAndUpdate(
      { _id: id, status: "pending" },
      {
        status: "active",
        startDate,
        endDate,
        term,
        interestRate,
        remainingBalance: totalPayable,
      },
      { session, new: true },
    );

    if (!updateLoan) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Loan was already processed by another request",
      );
    }

    const branchUpdate = await BranchModel.findOneAndUpdate(
      {
        _id: isLoanExist.branch,
        reserevedBalance: { $gte: loanAmount },
      },
      {
        $inc: {
          reserevedBalance: -loanAmount,
          usedBalance: loanAmount,
        },
      },
      { session, new: true },
    );

    if (!branchUpdate) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Branch does not have enough reserved balance to fund this loan",
      );
    }

    const rePaymentDetails = [];
    for (let i = 0; i < term; i++) {
      rePaymentDetails.push({
        dueDate: dayjs(startDate)
          .add(i + 1, "month")
          .toDate(),
        amountDue: monthlyDue,
        paid: false,
        paidDate: null,
      });
    }

    await LoanModel.findByIdAndUpdate(
      id,
      { repaymentSchedule: rePaymentDetails },
      { session },
    );

    const credited = await AccountModel.findOneAndUpdate(
      {
        accountNumber: isLoanExist.accountNumber,
        user: isLoanExist.user,
        status: "active",
      },
      { $inc: { balance: loanAmount } },
      { session, new: true },
    );
    if (!credited) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Customer account balance update failed",
      );
    }

    const branch = isLoanExist.branch as TBranch;
    const transaction_Id = await generateTransactionId("loan");
    await TransactionModel.create(
      [
        {
          account: isLoanExist.accountNumber,
          user: isLoanExist.user,
          transactionType: "loan",
          transaction_Id,
          status: "completed",
          description: "Loan disbursed after approval",
          amount: loanAmount,
          fromAccount: branch.name,
          toAccount: isLoanExist.accountNumber,
          loan: isLoanExist._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    if (isLoanExist.user) {
      void sendNotification({
        recipientId: isLoanExist.user,
        type: "loan",
        title: "Loan approved",
        message: `Your loan of ${loanAmount} was approved and disbursed.`,
        data: { loanId: id },
      });
    }
    return LoanModel.findById(id).populate("branch user account");
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  } finally {
    await session.endSession();
  }
};

const payLoan = async (
  id: string,
  user: TJwtUser,
  payload: { transactionType?: string; monthsToPay: number },
) => {
  const monthsToPay = Number(payload.monthsToPay);
  if (!monthsToPay || monthsToPay < 1 || !Number.isInteger(monthsToPay)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "monthsToPay must be a positive integer",
    );
  }

  const isLoanExist = await LoanModel.findById(id);
  if (!isLoanExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The Loan request is not found");
  }

  if (
    user.role === "customer" &&
    isLoanExist.user?.toString() !== user.user?.toString()
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not authorized to pay this loan",
    );
  }

  if (!["approved", "active"].includes(isLoanExist.status as string)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Only approved/active loans can be repaid",
    );
  }

  // Prevent overlapping pending loan payments
  const existingPending = await TransactionModel.findOne({
    loan: isLoanExist._id,
    transactionType: "deposit-loan",
    status: "pending",
  });
  if (existingPending) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "A loan payment is already pending. Complete or cancel it first.",
    );
  }

  const isUserExist = await User.findById(isLoanExist.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }

  const unpaid = (isLoanExist.repaymentSchedule || []).filter((m) => !m.paid);
  if (!unpaid.length) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Loan is already fully paid");
  }
  if (monthsToPay > unpaid.length) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `You only have ${unpaid.length} unpaid months left.`,
    );
  }

  const paidBalance = unpaid
    .slice(0, monthsToPay)
    .reduce((sum, month) => sum + month.amountDue, 0);
  const principalPortion =
    (Number(isLoanExist.loanAmount) / Number(isLoanExist.term)) * monthsToPay;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const transaction_Id = await generateTransactionId("deposit-loan");
    const [pendingTxn] = await TransactionModel.create(
      [
        {
          account: isLoanExist.accountNumber,
          user: isLoanExist.user,
          transactionType: "deposit-loan",
          transaction_Id,
          amount: paidBalance,
          status: "pending",
          description: `Loan repayment for ${monthsToPay} month(s)`,
          loan: isLoanExist._id,
          monthsToPay,
          fromAccount: isLoanExist.accountNumber,
        },
      ],
      { session },
    );

    const metaData = {
      loan: isLoanExist._id.toString(),
      paidBalance: paidBalance.toString(),
      principalPortion: principalPortion.toString(),
      monthsToPay: monthsToPay.toString(),
      transactionType: "deposit-loan",
      transactionId: pendingTxn._id.toString(),
      role: isUserExist.role,
    };

    const payment = await createPayment(
      paidBalance,
      isUserExist.email,
      metaData,
    );

    await TransactionModel.findByIdAndUpdate(
      pendingTxn._id,
      { stripeSessionId: payment.sessionId },
      { session },
    );

    await session.commitTransaction();
    return payment.url;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  } finally {
    await session.endSession();
  }
};

const getLoans = async (query: Record<string, unknown>) => {
  const loanQuery = new QueryBuilder(
    LoanModel.find().sort({ createdAt: 1 }).populate("user account branch"),
    query,
  )
    .search(searchLoans)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await loanQuery.countTotal();
  const result = await loanQuery.modelQuery;
  return { meta, result };
};

const getEachLoans = async (id: string, user?: TJwtUser) => {
  const result = await LoanModel.findById(id).populate("branch account");
  if (!result) {
    throw new AppError(HttpStatus.NOT_FOUND, "The loan is not exist");
  }
  if (user && user.role === "customer") {
    if (result.user?.toString() !== user.user?.toString()) {
      throw new AppError(HttpStatus.FORBIDDEN, "Not authorized");
    }
  }
  return result;
};

const myLoan = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid user ID");
  }

  const loans = await LoanModel.findOne({
    user: new Types.ObjectId(userId),
    status: { $ne: "paid" },
  }).populate("branch user account");

  if (!loans) {
    throw new AppError(HttpStatus.NOT_FOUND, "You don't have any loan");
  }
  return loans;
};

export const loadServices = {
  requestLoan,
  updateRequestedLoan,
  payLoan,
  getLoans,
  getEachLoans,
  myLoan,
};
