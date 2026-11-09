import HttpStatus from "http-status";
import sanitizeHtml from "sanitize-html";
import AppError from "../../../erros/AppError";
import { sanitizeOptions } from "../../../utils/SanitizeOptions";
import { User } from "../../User/user.model";
import { TJwtUser } from "../../../interface/global";
import { PrivacyModel } from "./Privacy.model";

const ensureAdmin = async (user: TJwtUser) => {
  const isUserExist = await User.findById(user.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
};

const getPrivacy = async () => {
  const privacy = await PrivacyModel.find().sort({ createdAt: -1 });
  return privacy[0] || null;
};

const upsertPrivacy = async (
  payload: { description: string },
  user: TJwtUser,
) => {
  await ensureAdmin(user);
  if (!payload.description) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Description is required");
  }
  const description = sanitizeHtml(payload.description, sanitizeOptions);
  return PrivacyModel.findOneAndUpdate(
    {},
    { description },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

export const privacyServices = {
  getPrivacy,
  upsertPrivacy,
};
