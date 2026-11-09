import HttpStatus from "http-status";
import { TransactionModel } from "./transaction.model";
import AppError from "../../erros/AppError";

const findLastTransaction = async () => {
  const result = await TransactionModel.findOne(
    {},
    {
      transaction_Id: 1,
      _id: 0,
    },
  )
    .sort({ createdAt: -1 })
    .lean();
  return result?.transaction_Id ? result.transaction_Id : undefined;
};

export const generateTransactionId = async (payload: string) => {
  let currentId;
  let curreentTraType;
  if (payload && payload === "deposit") {
    curreentTraType = "DEPOSIT";
  } else if (payload === "withdraw") {
    curreentTraType = "WITHDRAW";
  } else if (payload === "transfer") {
    curreentTraType = "TRANSFER";
  } else if (payload === "interest") {
    curreentTraType = "INTEREST";
  } else if (payload === "loan") {
    curreentTraType = "LOAN";
  } else if (payload === "deposit-loan") {
    curreentTraType = "DEPOSITLOAN";
  } else {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The transaction type is invalid",
    );
  }
  const findLastId = await findLastTransaction();
  if (findLastId) {
    currentId = findLastId.split("_")[1];
    let incrementId = (Number(currentId) + 1).toString().padStart(4, "0");
    incrementId = `EB${curreentTraType}_${incrementId}`;
    return incrementId;
  } else {
    return `EB${curreentTraType}_0001`;
  }
};
