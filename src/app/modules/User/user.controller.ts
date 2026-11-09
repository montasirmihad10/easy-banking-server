import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { getParam } from "../../utils/getParam";
import { userServices } from "./user.service";

const createCustomer = catchAsync(async (req, res) => {
  const file = req.file;
  console.log(file);
  const result = await userServices.createCustomer(file, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User created succesfully",
    data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const result = await userServices.verifyOtp(req.body);
  const { accessToken, refreshToken, newUser } = result;

  // res.cookie("accessToken", accessToken, {
  //   secure: config.node_env === "production", // true in production
  //   httpOnly: false, // Set to false for Next.js to access
  //   sameSite: config.node_env === "production" ? "none" : "lax",
  //   maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  // });
  // res.cookie("refreshToken", refreshToken, {
  //   secure: config.node_env === "production", // true in production
  //   httpOnly: false, // Set to false for Next.js to access
  //   sameSite: config.node_env === "production" ? "none" : "lax",
  //   maxAge: 1000 * 60 * 60 * 24 * 365, // 7 days
  // });

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User created successfully",
    data: {
      accessToken,
      refreshToken,
      newUser,
    },
  });
});

const getUsers = catchAsync(async (req, res) => {
  const result = await userServices.getUsers(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User retrived succesfully",
    meta: result.meta,
    data: result.result,
  });
});

const getManagers = catchAsync(async (req, res) => {
  const result = await userServices.getManagers();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Managers retrived succesfully",
    data: result,
  });
});

const getAdmins = catchAsync(async (req, res) => {
  const result = await userServices.getAdmins();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User retrived succesfully",
    data: result,
  });
});

const updateUserRole = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await userServices.updateUserRole(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User retrived succesfully",
    data: result,
  });
});

const getEachUsers = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await userServices.getEachUsers(id, req.user as never);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User retrived succesfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await userServices.deleteUser(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User deleted succesfully",
    data: result,
  });
});

export const userControllers = {
  createCustomer,
  getUsers,
  updateUserRole,
  verifyOtp,
  getManagers,
  getAdmins,
  getEachUsers,
  deleteUser,
};
