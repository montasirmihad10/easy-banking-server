import HttpStatus from "http-status";
import mongoose from "mongoose";
import { AccountModel } from "../Account/account.model";
import { LoanModel } from "../Loan/loan.model";
import { TransactionModel } from "../Transactions/transaction.model";
import AppError from "../../erros/AppError";
import { BranchModel } from "../Branches/branch.model";
import { User } from "../User/user.model";

const getAdminStats = async () => {
  const result = await AccountModel.aggregate([
    {
      $facet: {
        // 1. Account Type Distribution (Pie Chart)
        accountTypes: [
          {
            $group: {
              _id: "$accountType",
              count: { $sum: 1 },
              totalBalance: { $sum: "$balance" },
            },
          },
        ],
        // 2. Transaction Types (Bar Chart)
        transactionTypes: [
          {
            $lookup: {
              from: "transactions",
              localField: "accountNumber",
              foreignField: "account",
              as: "transactions",
            },
          },
          {
            $unwind: "$transactions",
          },
          {
            $group: {
              _id: "$transactions.transactionType",
              count: { $sum: 1 },
              totalBalance: { $sum: "$transactions.amount" },
            },
          },
        ],
        // loan insights
        loanInsights: [
          {
            $lookup: {
              from: "loans",
              localField: "accountNumber",
              foreignField: "accountNumber",
              as: "loans",
            },
          },
          {
            $unwind: "$loans",
          },
          {
            $group: {
              _id: "$loans.status",
              count: { $sum: 1 },
              totalLoanAmount: { $sum: "$loans.loanAmount" },
              avgInterestRate: { $avg: "$loans.interestRate" },
            },
          },
        ],
        // 5. User Growth (New)
        userGrowth: [
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $group: {
              _id: {
                year: { $year: "$user.createdAt" },
                month: { $month: "$user.createdAt" },
              },
              newUsers: { $sum: 1 },
            },
          },
        ],
        // branch performance
        branchDetails: [
          {
            $lookup: {
              from: "branches",
              localField: "branch",
              foreignField: "_id",
              as: "branches",
            },
          },
          { $unwind: "$branches" },
          {
            $group: {
              _id: ["$branches.name", "$branches.code"],
              count: { $sum: 1 },
              reserevedBalance: { $first: "$branches.reserevedBalance" },
              usedBalance: { $first: "$branches.usedBalance" },
            },
          },
          {
            $project: {
              count: 1,
              reserevedBalance: 1,
              usedBalance: 1,
              liquidityRatio: {
                $multiply: [
                  { $divide: ["$usedBalance", "$reserevedBalance"] },
                  100,
                ],
              },
            },
          },
        ],
      },
    },
  ]);
  return result;
};

const getLastMonthStats = async () => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const transactions = await TransactionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: oneMonthAgo },
          transactionType: {
            $in: [
              "deposit",
              "withdraw",
              "transfer",
              "deposit-loan",
              "loan",
              "interest",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$transactionType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]).session(session);
    const loans = await LoanModel.aggregate([
      {
        $match: {
          createdAt: { $gte: oneMonthAgo },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$loanAmount" },
        },
      },
    ]).session(session);
    // 3. Daily Trends (For Line Charts)
    const dailyTrends = await TransactionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: oneMonthAgo },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            type: "$transactionType",
          },
          dailyAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.day": 1 },
      },
    ]).session(session);

    await session.commitTransaction();
    await session.endSession();
    return { transactions, loans, dailyTrends };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Last month stats retrieve failed",
    );
  }
};

const getBankDetails = async () => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const liquidityStats = await BranchModel.aggregate([
      {
        $project: {
          name: 1,
          reserevedBalance: 1,
          usedBalance: 1,
          liquidityRisk: {
            $cond: [
              { $gte: ["$usedBalance", "$reserevedBalance"] },
              "CRITICAL",
              {
                $cond: [
                  {
                    $gte: [
                      { $multiply: ["$usedBalance", 0.8] },
                      "$reserevedBalance",
                    ],
                  },
                  "WARNING",
                  "SAFE",
                ],
              },
            ],
          },
        },
      },
    ]).session(session);

    const userFunnel = await User.aggregate([
      {
        $lookup: {
          from: "accounts",
          localField: "_id",
          foreignField: "user",
          as: "accounts",
        },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          usersWithAccounts: {
            $sum: { $cond: [{ $gt: [{ $size: "$accounts" }, 0] }, 1, 0] },
          },
          activeAccounts: {
            $sum: {
              $size: {
                $filter: {
                  input: "$accounts",
                  as: "acc",
                  cond: { $eq: ["$$acc.status", "active"] },
                },
              },
            },
          },
          inactiveAccounts: {
            $sum: {
              $size: {
                $filter: {
                  input: "$accounts",
                  as: "acc",
                  cond: { $ne: ["$$acc.status", "active"] },
                },
              },
            },
          },
        },
      },
    ]).session(session);

    const dailyTransationCount = await TransactionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: "$account",
          txCount: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]).session(session);

    const inactiveAccounts = await AccountModel.aggregate([
      {
        $lookup: {
          from: "transactions",
          localField: "accountNumber",
          foreignField: "account",
          as: "lastTx",
        },
      },
      {
        $addFields: {
          lastActivity: { $max: "$lastTx.createdAt" },
        },
      },
      {
        $match: {
          lastActivity: {
            $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          }, // 90+ days inactive
          balance: { $gt: 0 }, // With money left
        },
      },
      {
        $project: {
          accountNumber: 1,
          email: 1,
        },
      },
    ]).session(session);
    await session.commitTransaction();
    await session.endSession();
    return {
      liquidityStats,
      userFunnel,
      dailyTransationCount,
      inactiveAccounts,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, "Bank details retrieve failed");
  }
};

export const statServices = {
  getAdminStats,
  getLastMonthStats,
  getBankDetails,
};
