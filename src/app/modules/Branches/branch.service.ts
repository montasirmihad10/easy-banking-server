import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { TBranch } from "./branch.interface";
import { BranchModel } from "./branch.model";
import { Document, Types } from "mongoose";
import { User } from "../User/user.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { searchBranch } from "./branch.const";
import { TUserInterface } from "../User/user.interface";
import { TJwtUser } from "../../interface/global";

const createBranch = async (payload: TBranch) => {
  const isSameCodeBranchExist = await BranchModel.findOne({
    code: payload.code,
  });
  if (isSameCodeBranchExist) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Same code of branch is already exist",
    );
  }

  const isSameZipCodeBranchExist = await BranchModel.findOne({
    zipCode: payload.zipCode,
  });
  if (isSameZipCodeBranchExist) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Same Zip code of branch is already exist",
    );
  }

  let isManagersExist: (Document<unknown, TUserInterface> &
    TUserInterface & {
      _id: Types.ObjectId;
    } & {
      __v: number;
    })[] = [];
  if (payload.managers && payload.managers?.length > 0) {
    isManagersExist = await User.find({
      _id: {
        $in: payload.managers.map((id) => new Types.ObjectId(id)),
      },
    });
    if (isManagersExist.length !== payload.managers?.length) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "One or more managers are not exist",
      );
    }
  } else {
    isManagersExist = [];
  }
  payload.branchOpenedAt = new Date();
  const result = await BranchModel.create(payload);
  return result;
};

const getBranches = async (query: Record<string, unknown>) => {
  const branchQuery = new QueryBuilder(
    BranchModel.find().populate("managers"),
    query,
  )
    .search(searchBranch)
    .filter()
    .sort()
    .paginate()
    .fields();
  const meta = await branchQuery.countTotal();
  const result = await branchQuery.modelQuery;
  return { meta, result };
};

const getMyBranch = async (user: TJwtUser) => {
  const isUserExist = await User.findOne({
    _id: new Types.ObjectId(user?.user),
    role: "manager",
  });
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Manager not found");
  }
  const isBranchExist = await BranchModel.findOne({
    managers: isUserExist?._id,
  }).populate("managers");
  if (!isBranchExist) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "The manager is not added in any branch",
    );
  }
  return isBranchExist;
};

const getEachBranch = async (id: string) => {
  const result = await BranchModel.findById(id).populate("managers");
  return result;
};

const updateBranch = async (id: string, payload: Partial<TBranch>) => {
  const isBranchExist = await BranchModel.findById(id);
  if (!isBranchExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The branch is not exist");
  }
  const { openingSchedule, ...remainingData } = payload;

  const modifiedData: Record<string, unknown> = {
    ...remainingData,
  };

  if (openingSchedule && Object.keys(openingSchedule).length) {
    for (const [key, value] of Object.entries(openingSchedule)) {
      modifiedData[`openingSchedule.${key}`] = value;
    }
  }

  const result = await BranchModel.findByIdAndUpdate(id, modifiedData, {
    new: true,
    runValidators: true,
  });
  return result;
};

const updateBranchManagers = async (
  id: string,
  data: { managers: string[] },
) => {
  const { managers } = data;
  const managerObjectIds = managers?.map((id) => new Types.ObjectId(id));

  if (!managerObjectIds.length) {
    throw new AppError(HttpStatus.NOT_FOUND, "The manager is empty");
  }

  if (managerObjectIds.length > 0) {
    const existingManagers = await User.find({
      role: "manager",
      _id: { $in: managerObjectIds },
    });

    if (existingManagers.length !== managerObjectIds.length) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "One or more manager IDs are invalid or do not exist.",
      );
    }
  }

  const result = await BranchModel.findByIdAndUpdate(
    id,
    {
      $addToSet: { managers: { $each: managerObjectIds } },
    },
    { new: true },
  );

  if (!result) {
    throw new AppError(HttpStatus.NOT_FOUND, "Branch not found.");
  }

  return result;
};

export const branchServices = {
  createBranch,
  getBranches,
  getEachBranch,
  updateBranch,
  updateBranchManagers,
  getMyBranch,
};
