import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { getParam } from "../../utils/getParam";
import { branchServices } from "./branch.service";
import { TJwtUser } from "../../interface/global";

const createBranch = catchAsync(async (req, res) => {
  const result = await branchServices.createBranch(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Branch created succesfully",
    data: result,
  });
});

const getBranches = catchAsync(async (req, res) => {
  const result = await branchServices.getBranches(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Branch retrieved succesfully",
    meta: result.meta,
    data: result.result,
  });
});

const getMyBranch = catchAsync(async (req, res) => {
  const user = req.user as TJwtUser;
  const result = await branchServices.getMyBranch(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Branch retrieved succesfully",
    data: result,
  });
});

const getEachBranch = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await branchServices.getEachBranch(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Branch retrieved succesfully",
    data: result,
  });
});

const updateBranch = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await branchServices.updateBranch(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Branch updated succesfully",
    data: result,
  });
});

const updateBranchManagers = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await branchServices.updateBranchManagers(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Branch updated succesfully",
    data: result,
  });
});

export const branchControllers = {
  createBranch,
  getBranches,
  getEachBranch,
  updateBranch,
  updateBranchManagers,
  getMyBranch,
};
