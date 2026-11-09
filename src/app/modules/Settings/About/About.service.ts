import HttpStatus from "http-status";
import sanitizeHtml from "sanitize-html";
import AppError from "../../../erros/AppError";
import { sanitizeOptions } from "../../../utils/SanitizeOptions";
import { User } from "../../User/user.model";
import { TJwtUser } from "../../../interface/global";
import { AboutModel } from "./About.model";

const ensureAdmin = async (user: TJwtUser) => {
  const isUserExist = await User.findById(user.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
};

const getAbout = async () => {
  const about = await AboutModel.find().sort({ createdAt: -1 });
  return about[0] || null;
};

const upsertAbout = async (
  payload: { description: string },
  user: TJwtUser,
) => {
  await ensureAdmin(user);
  if (!payload.description) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Description is required");
  }
  const description = sanitizeHtml(payload.description, sanitizeOptions);
  return AboutModel.findOneAndUpdate(
    {},
    { description },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

export const aboutServices = {
  getAbout,
  upsertAbout,
};
