import { ACCOUNT_TYPE } from "../../interface/global";
import { TBankAccount } from "./account.interface";
import { AccountModel } from "./account.model";

const findLastSavingAccount = async () => {
  const result = await AccountModel.findOne(
    {},
    {
      accountNumber: 1,
      _id: 0,
    },
  )
    .sort({ createdAt: -1 })
    .lean();
  return result?.accountNumber ? result?.accountNumber : undefined;
};

export const generateSavingAccountNumber = async (payload: TBankAccount) => {
  let currentAccountNumber;
  let accountTp;
  const lastAccountNumber = await findLastSavingAccount();
  const branchCode = payload?.branchCode;
  const accountType = payload?.accountType;
  if (accountType === "savings") {
    accountTp = ACCOUNT_TYPE.savings;
  } else if (accountType === "checking") {
    accountTp = ACCOUNT_TYPE.checking;
  } else if (accountType === "business") {
    accountTp = ACCOUNT_TYPE.business;
  } else {
    accountTp = "";
  }
  if (lastAccountNumber) {
    currentAccountNumber = lastAccountNumber?.split("-")[1];
    let incrementAccountNumber = (Number(currentAccountNumber) + 1)
      .toString()
      .padStart(7, "0");
    incrementAccountNumber = `EB${branchCode}${accountTp}-${incrementAccountNumber}`;
    // console.log(incrementAccountNumber);
    return incrementAccountNumber;
  } else {
    const firstAccountNumber = `EB${branchCode}${accountTp}-0000001`;
    return firstAccountNumber;
  }
};
