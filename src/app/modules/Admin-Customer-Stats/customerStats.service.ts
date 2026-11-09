import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import AppError from "../../erros/AppError";
import { AccountModel } from "../Account/account.model";
import { TJwtUser } from "../../interface/global";
import { TransactionModel } from "../Transactions/transaction.model";
import { LoanModel } from "../Loan/loan.model";

const getCustomerStats = async (user: TJwtUser) => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const userId = new Types.ObjectId(user?.user);
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const customerStats = await AccountModel.aggregate([
      { $match: { user: userId } },
      {
        $facet: {
          // 1. Balance Distribution (Pie Chart)
          balanceDistribution: [
            {
              $group: {
                _id: "$accountType",
                balance: { $sum: "$balance" },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                accountType: "$_id",
                balance: 1,
                count: 1,
                percentage: {
                  $multiply: [
                    { $divide: ["$balance", { $sum: "$balance" }] },
                    100,
                  ],
                },
              },
            },
          ],

          // 2. Monthly Spending (Bar Chart)
          monthlySpending: [
            {
              $lookup: {
                let: { accountNum: "$accountNumber" },
                from: "transactions",
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$account", "$$accountNum"] },
                          { $eq: ["$user", userId] },
                        ],
                      },
                      createdAt: { $gte: oneMonthAgo },
                      transactionType: {
                        $in: [
                          "deposit",
                          "withdraw",
                          "transfer",
                          "loan",
                          "deposit-loan",
                          "interest",
                        ],
                      },
                    },
                  },
                ],
                as: "txns",
              },
            },
            { $unwind: "$txns" },
            {
              $group: {
                _id: {
                  month: { $month: "$txns.createdAt" },
                  //   year: { $year: "$txns.createdAt" },
                  type: "$txns.transactionType",
                },
                amount: { $sum: "$txns.amount" },
              },
            },
            {
              $group: {
                _id: "$_id.month",
                transactions: {
                  $push: {
                    type: "$_id.type",
                    amount: "$amount",
                  },
                },
                totalAmount: { $sum: "$amount" },
              },
            },
            {
              $project: {
                month: "$_id",
                transactions: 1,
                totalAmount: 1,
                deposits: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$transactions",
                          as: "txn",
                          cond: { $eq: ["$$txn.type", "deposit"] },
                        },
                      },
                      as: "d",
                      in: "$$d.amount",
                    },
                  },
                },
                withdrawals: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$transactions",
                          as: "txn",
                          cond: { $eq: ["$$txn.type", "withdraw"] },
                        },
                      },
                      as: "w",
                      in: "$$w.amount",
                    },
                  },
                },
                transfers: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$transactions",
                          as: "txn",
                          cond: { $eq: ["$$txn.type", "transfer"] },
                        },
                      },
                      as: "t",
                      in: "$$t.amount",
                    },
                  },
                },
                loans: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$transactions",
                          as: "txn",
                          cond: { $eq: ["$$txn.type", "loan"] },
                        },
                      },
                      as: "l",
                      in: "$$l.amount",
                    },
                  },
                },
                loanRepayments: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$transactions",
                          as: "txn",
                          cond: { $eq: ["$$txn.type", "deposit-loan"] },
                        },
                      },
                      as: "lr",
                      in: "$$lr.amount",
                    },
                  },
                },
                interests: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$transactions",
                          as: "txn",
                          cond: { $eq: ["$$txn.type", "interest"] },
                        },
                      },
                      as: "lr",
                      in: "$$lr.amount",
                    },
                  },
                },
              },
            },
            { $sort: { month: 1 } },
          ],

          //   3. Transaction Frequency (Line Chart)
          transactionFrequency: [
            {
              $lookup: {
                from: "transactions",
                let: { accountNum: "$accountNumber" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$account", "$$accountNum"] },
                      user: userId,
                      createdAt: { $gte: oneMonthAgo },
                    },
                  },
                ],
                as: "txns",
              },
            },
            { $unwind: "$txns" },
            {
              $group: {
                _id: {
                  date: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$txns.createdAt",
                    },
                  },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.date": 1 } },
            { $limit: 30 },
          ],

          // 4. Loan Progress (Doughnut Chart)
          loanProgress: [
            {
              $lookup: {
                from: "loans",
                let: { accountNum: "$accountNumber" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$accountNumber", "$$accountNum"] },
                      user: userId,
                      status: { $nin: ["paid", "rejected"] },
                    },
                  },
                ],
                as: "loans",
              },
            },
            { $unwind: "$loans" },
            {
              $project: {
                _id: 0,
                loanAmount: "$loans.loanAmount",
                repaymentScheduleLength: {
                  $size: "$loans.repaymentSchedule",
                },
                paidCount: {
                  $size: {
                    $filter: {
                      input: "$loans.repaymentSchedule",
                      as: "payment",
                      cond: { $eq: ["$$payment.paid", true] },
                    },
                  },
                },
                paid: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$loans.repaymentSchedule",
                          as: "payment",
                          cond: { $eq: ["$$payment.paid", true] },
                        },
                      },
                      as: "paidItem",
                      in: "$$paidItem.amountDue",
                    },
                  },
                },
                remaining: "$loans.remainingBalance",
                status: "$loans.status",
                nextPaymentDate: {
                  $arrayElemAt: ["$loans.repaymentSchedule.dueDate", 0],
                },
              },
            },
          ],

          // 5. Recent Transactions (Table)
          recentTransactions: [
            {
              $lookup: {
                from: "transactions",
                let: { accountNum: "$accountNumber" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$account", "$$accountNum"] },
                      user: userId,
                      createdAt: { $gte: oneMonthAgo },
                    },
                  },
                  { $sort: { createdAt: -1 } },
                  { $limit: 5 },
                ],
                as: "txns",
              },
            },
            { $unwind: "$txns" },
            {
              $project: {
                _id: 0,
                type: "$txns.transactionType",
                amount: "$txns.amount",
                date: "$txns.createdAt",
                description: "$txns.description",
                status: "$txns.status",
              },
            },
          ],
        },
      },
    ]).session(session);

    await session.commitTransaction();
    await session.endSession();
    return customerStats;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Customer stats retrieve failed",
    );
  }
};

const getAdditionalCustomerStats = async (user: TJwtUser) => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const userId = new Types.ObjectId(user?.user);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const spendingByCategory = await TransactionModel.aggregate([
      {
        $match: {
          user: userId,
          transactionType: {
            $in: [
              "deposit",
              "withdraw",
              "transfer",
              "loan",
              "deposit-loan",
              "interest",
            ],
          },
          createdAt: { $gte: oneMonthAgo },
        },
      },
      {
        $group: {
          _id: "$transactionType",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          // Add the most recent update date for each type
          lastUpdated: { $max: "$updatedAt" },
          // Optional: include the earliest transaction date
          firstTransaction: { $min: "$createdAt" },
        },
      },
      {
        $project: {
          transactionType: "$_id",
          total: 1,
          count: 1,
          lastUpdated: 1,
          firstTransaction: 1,
          _id: 0,
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]).session(session);

    // 2. Loan Overview (Active loans summary)
    const loanOverview = await LoanModel.aggregate([
      {
        $match: {
          user: userId,
          status: "active",
        },
      },
      {
        $lookup: {
          from: "transactions",
          let: { accountNum: "$accountNumber" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$account", "$$accountNum"] },
                    { $eq: ["$user", userId] },
                    { $eq: ["$transactionType", "deposit-loan"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalPaid: { $sum: "$amount" },
              },
            },
          ],
          as: "payments",
        },
      },
      {
        $addFields: {
          paidFromTransactions: {
            $ifNull: [{ $arrayElemAt: ["$payments.totalPaid", 0] }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalBorrowed: { $sum: "$loanAmount" },
          totalRemaining: { $sum: "$remainingBalance" },
          totalPaidFromTxns: { $sum: "$paidFromTransactions" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalPrincipal: "$totalBorrowed",
          totalRemaining: 1,
          totalPaid: "$totalPaidFromTxns",
          count: 1,
          repaymentProgress: {
            $multiply: [
              { $divide: ["$totalPaidFromTxns", "$totalWithInterest"] },
              100,
            ],
          },
          interestPaid: {
            $subtract: [
              "$totalPaidFromTxns",
              { $subtract: ["$totalBorrowed", "$totalRemaining"] },
            ],
          },
        },
      },
    ]).session(session);

    // 3. Account Type Distribution
    const accountDistribution = await AccountModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$accountType",
          count: { $sum: 1 },
          totalBalance: { $sum: "$balance" },
        },
      },
      {
        $project: {
          accountType: "$_id",
          count: 1,
          totalBalance: 1,
          percentage: {
            $multiply: [{ $divide: ["$count", { $sum: "$count" }] }, 100],
          },
        },
      },
    ]).session(session);

    // 4. Recent Large Transactions (Top 5 by amount)
    const largeTransactions = await TransactionModel.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: oneMonthAgo },
          amount: { $gte: 1000 }, // Adjust threshold as needed
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          type: "$transactionType",
          amount: 1,
          date: "$createdAt",
          description: 1,
          account: 1,
        },
      },
    ]).session(session);

    await session.commitTransaction();
    await session.endSession();

    return {
      spendingByCategory,
      loanOverview: loanOverview[0] || null,
      accountDistribution,
      largeTransactions,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Failed to retrieve additional customer stats",
    );
  }
};

export const customerStatServices = {
  getCustomerStats,
  getAdditionalCustomerStats,
};
