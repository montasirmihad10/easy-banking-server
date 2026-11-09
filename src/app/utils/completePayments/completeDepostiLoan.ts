import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import Stripe from "stripe";
import { LoanModel } from "../../modules/Loan/loan.model";
import AppError from "../../erros/AppError";
import { BranchModel } from "../../modules/Branches/branch.model";
import { TransactionModel } from "../../modules/Transactions/transaction.model";
import { TLoan } from "../../modules/Loan/loan.interface";
import { TBranch } from "../../modules/Branches/branch.interface";

type LoanWithBranchPopulated = TLoan & {
  branch: TBranch | Types.ObjectId;
};

export const completeDepostiLoan = async (
  metadata: Stripe.Metadata,
  stripeSessionId?: string,
) => {
  const transactionId = metadata.transactionId;
  const loanId = metadata.loan;
  const monthsToPay = Number(metadata.monthsToPay);
  const paidBalance = Number(metadata.paidBalance);
  const principalPortion = Number(metadata.principalPortion || 0);

  if (!transactionId || !loanId || !monthsToPay || !paidBalance) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid loan payment metadata");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Idempotency via pending payment txn
    const pendingTxn = await TransactionModel.findOneAndUpdate(
      {
        _id: transactionId,
        status: "pending",
        transactionType: "deposit-loan",
      },
      {
        status: "completed",
        ...(stripeSessionId ? { stripeSessionId } : {}),
      },
      { session, new: true },
    );

    if (!pendingTxn) {
      await session.abortTransaction();
      return await LoanModel.findById(loanId);
    }

    const isLoanExist = (await LoanModel.findById(loanId)
      .session(session)
      .populate("branch")) as LoanWithBranchPopulated | null;

    if (!isLoanExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "The Loan request is not found");
    }

    if (!["approved", "active"].includes(isLoanExist.status as string)) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Loan is not in a payable status",
      );
    }

    const unpaidLoans = isLoanExist.repaymentSchedule || [];
    let count = 0;
    const updatedSchedule = unpaidLoans.map((item) => {
      if (!item.paid && count < monthsToPay) {
        count++;
        return {
          ...item,
          paid: true,
          paidDate: new Date(),
        };
      }
      return item;
    });

    if (count === 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "No unpaid installments left to mark",
      );
    }

    const remainingBalance = Math.max(
      0,
      Number(isLoanExist.remainingBalance || 0) - paidBalance,
    );
    const allPaid = updatedSchedule.every((item) => item.paid);

    const updatedPay = await LoanModel.findOneAndUpdate(
      {
        _id: loanId,
        status: { $in: ["approved", "active"] },
      },
      {
        $set: {
          repaymentSchedule: updatedSchedule,
          remainingBalance,
          status: allPaid ? "paid" : "active",
        },
      },
      { session, new: true },
    );

    if (!updatedPay) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Loan payment update failed");
    }

    const branchId =
      typeof isLoanExist.branch === "object" && "_id" in (isLoanExist.branch as object)
        ? (isLoanExist.branch as TBranch & { _id: Types.ObjectId })._id ||
          isLoanExist.branch
        : isLoanExist.branch;

    await BranchModel.findByIdAndUpdate(
      branchId,
      {
        $inc: {
          reserevedBalance: paidBalance,
          usedBalance: -(principalPortion || paidBalance),
        },
      },
      { session },
    );

    await session.commitTransaction();
    return updatedPay;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  } finally {
    await session.endSession();
  }
};
