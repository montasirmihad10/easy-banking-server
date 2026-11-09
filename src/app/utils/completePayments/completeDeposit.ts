import HttpStatus from "http-status";
import mongoose from "mongoose";
import Stripe from "stripe";
import { AccountModel } from "../../modules/Account/account.model";
import AppError from "../../erros/AppError";
import { TransactionModel } from "../../modules/Transactions/transaction.model";
import { BranchModel } from "../../modules/Branches/branch.model";
import { sendNotification } from "../../modules/Notification/notification.utils";

export const completeDeposit = async (
  metaData: Stripe.Metadata,
  stripeSessionId?: string,
) => {
  const amount = Number(metaData.amount);
  const transactionId = metaData.transactionId;
  const accountNumber = metaData.accountNumber;

  if (!transactionId || !accountNumber || !amount || amount <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid deposit metadata");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Idempotency: only complete if still pending
    const pendingTxn = await TransactionModel.findOneAndUpdate(
      {
        _id: transactionId,
        status: "pending",
        transactionType: "deposit",
      },
      {
        status: "completed",
        ...(stripeSessionId ? { stripeSessionId } : {}),
      },
      { session, new: true },
    );

    if (!pendingTxn) {
      // Already completed or missing — safe no-op for Stripe retries
      await session.abortTransaction();
      const existing = await TransactionModel.findById(transactionId);
      return existing;
    }

    const updatedAccount = await AccountModel.findOneAndUpdate(
      {
        accountNumber,
        status: "active",
      },
      {
        $inc: { balance: amount },
      },
      { session, new: true },
    );

    if (!updatedAccount) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Balance update failed");
    }

    // Keep branch float in sync with customer liability
    if (updatedAccount.branch) {
      await BranchModel.findByIdAndUpdate(
        updatedAccount.branch,
        { $inc: { reserevedBalance: amount } },
        { session },
      );
    }

    await session.commitTransaction();
    if (updatedAccount.user) {
      void sendNotification({
        recipientId: updatedAccount.user,
        type: "transaction",
        title: "Deposit successful",
        message: `Your deposit of ${amount} has been credited.`,
        data: { transactionId: pendingTxn._id, accountNumber },
      });
    }
    return pendingTxn;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  } finally {
    await session.endSession();
  }
};
