import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../erros/AppError";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import {
  getBankSettings,
  getPublicBankSettings,
  updateBankSettings,
} from "./settings.service";

const getSettings = catchAsync(async (req, res) => {
  const result = await getPublicBankSettings();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Bank settings retrieved successfully",
    data: result,
  });
});

const getAdminSettings = catchAsync(async (req, res) => {
  const result = await getBankSettings();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Admin bank settings retrieved successfully",
    data: result,
  });
});

const updateSettings = catchAsync(async (req, res) => {
  const result = await updateBankSettings(req.body);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Bank settings updated successfully",
    data: result,
  });
});

const uploadWebsiteImage = catchAsync(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Image file is required");
  }

  const uploaded = await sendImageToCloudinary(
    file.buffer,
    file.originalname,
    file.mimetype,
    "easy-banking/website",
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Image uploaded to Cloudinary successfully",
    data: {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    },
  });
});

export const settingsControllers = {
  getSettings,
  getAdminSettings,
  updateSettings,
  uploadWebsiteImage,
};
