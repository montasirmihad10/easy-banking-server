import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { TOtp } from "./user.interface";
import { User } from "./user.model";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { sendOtpToEmail, verifyOtpAndCreateUser } from "../../utils/Otp";
import QueryBuilder from "../../builder/QueryBuilder";
import { searchUsers } from "./user.const";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createCustomer = async (file: any, payload: TOtp) => {
  console.log(payload);
  const isUserExist = await User.findOne({ email: payload?.email });
  if (isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The User already exists");
  }

  if (file) {
    const imageName = `${payload.name.firstName}-${payload.name.lastName}`;
    const profileImg = await sendImageToCloudinary(
      file.buffer,
      imageName,
      file.mimetype,
    );
    payload.profilePhotoUrl = profileImg?.secure_url;
  }
  const result = await sendOtpToEmail(payload);
  return result;
};

const verifyOtp = async (payload: { email: string; otp: string }) => {
  if (!payload.email || !payload.otp) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Email or OTP required");
  }
  const result = await verifyOtpAndCreateUser(payload);
  return result;
};

const getUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find().select("-password"), query)
    .search(searchUsers)
    .filter()
    .sort()
    .paginate()
    .fields();
  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;
  return { meta, result };
};

const getEachUsers = async (
  id: string,
  requester?: { user: unknown; role: string },
) => {
  const result = await User.findById(id).select("-password");
  if (!result) {
    throw new AppError(HttpStatus.NOT_FOUND, "The User is not exist");
  }
  if (
    requester?.role === "customer" &&
    String(result._id) !== String(requester.user)
  ) {
    throw new AppError(HttpStatus.FORBIDDEN, "Not authorized");
  }
  return result;
};

const deleteUser = async (id: string) => {
  const isUserExist = await User.findById(id);
  if (!isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The User is not exist");
  }
  if (isUserExist.isDeleted) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The User already deleted");
  }
  const result = await User.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
    },
    { new: true },
  );
  return result;
};

const updateUserRole = async (id: string, payload: { role: string }) => {
  const isUserExist = await User.findById(id);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  const result = await User.findByIdAndUpdate(
    id,
    {
      role: payload.role,
    },
    { new: true },
  );
  return result;
};

const getManagers = async () => {
  const result = await User.find({ role: "manager" });
  return result;
};

const getAdmins = async () => {
  const result = await User.find({ role: "admin" });
  return result;
};

export const userServices = {
  createCustomer,
  getUsers,
  updateUserRole,
  verifyOtp,
  getManagers,
  getAdmins,
  getEachUsers,
  deleteUser,
};
