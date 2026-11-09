import { AccountModel } from "../modules/Account/account.model";
import dayjs from "dayjs";
import { generateTransactionId } from "../modules/Transactions/transaction.utils";
import { TransactionModel } from "../modules/Transactions/transaction.model";
import mongoose from "mongoose";
import { BranchModel } from "../modules/Branches/branch.model";
import { getBankSettings } from "../modules/Settings/settings.service";

export const applyMonthlyInterests = async () => {
  const settings = await getBankSettings();
  const accounts = await AccountModel.find({
    status: "active",
    accountType: "savings",
  });

  const now = new Date();
  const defaultRate = settings.savingsAnnualInterestRate;
  const n = settings.interestCompoundingFrequencyPerYear || 1;

  for (const account of accounts) {
    const lastApplied = account.lastInterestDate;
    const yearPassed = dayjs(now).diff(dayjs(lastApplied), "year");
    if (yearPassed < 1) continue;

    const interestRate =
      typeof account.interestRate === "number" && account.interestRate > 0
        ? account.interestRate
        : defaultRate;
    const balance = account.balance as number;
    const A = balance * Math.pow(1 + interestRate / n, n * yearPassed);
    const interest = Math.ceil(A - balance);
    if (interest <= 0) continue;

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const updated = await AccountModel.findOneAndUpdate(
        {
          _id: account._id,
          status: "active",
          lastInterestDate: lastApplied,
        },
        {
          $inc: { balance: interest },
          $set: { lastInterestDate: now },
        },
        { session, new: true },
      );

      if (!updated) {
        await session.abortTransaction();
        continue;
      }

      await BranchModel.findByIdAndUpdate(
        account.branch,
        { $inc: { reserevedBalance: -interest } },
        { session },
      );

      const transactionId = await generateTransactionId("interest");
      await TransactionModel.create(
        [
          {
            account: account.accountNumber,
            transaction_Id: transactionId,
            transactionType: "interest",
            status: "completed",
            amount: interest,
            description: `${yearPassed} year(s) interest of ${interest} ${settings.currency} added to account ${account.accountNumber}`,
            user: account.user,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      // eslint-disable-next-line no-console
      console.log(
        `Interest ${interest} applied to ${account.accountNumber}`,
      );
    } catch (err) {
      await session.abortTransaction();
      // eslint-disable-next-line no-console
      console.log(err);
    } finally {
      await session.endSession();
    }
  }
};
