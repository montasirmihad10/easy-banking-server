import HttpStatus from "http-status";
import sanitizeHtml from "sanitize-html";
import AppError from "../../../erros/AppError";
import { sanitizeOptions } from "../../../utils/SanitizeOptions";
import { User } from "../../User/user.model";
import { TJwtUser } from "../../../interface/global";
import { TermsModel } from "./Terms.model";

const ensureAdmin = async (user: TJwtUser) => {
  const isUserExist = await User.findById(user.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
};

const getTerms = async () => {
  const terms = await TermsModel.find().sort({ createdAt: -1 });
  return terms[0] || null;
};

const upsertTerms = async (
  payload: { description: string },
  user: TJwtUser,
) => {
  await ensureAdmin(user);
  if (!payload.description) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Description is required");
  }
  const description = sanitizeHtml(payload.description, sanitizeOptions);
  return TermsModel.findOneAndUpdate(
    {},
    { description },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

export const termsServices = {
  getTerms,
  upsertTerms,
};
