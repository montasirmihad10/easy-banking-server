import bcrypt from "bcrypt";
import HttpStatus from "http-status";
import AppError from "../erros/AppError";
import { USER_ROLE } from "../interface/global";
import { TOtp } from "../modules/User/user.interface";
import { OtpModel, User } from "../modules/User/user.model";
import { sendEmail } from "./sendEmail";
import mongoose from "mongoose";
import { JwtPayload } from "../modules/Auth/auth.service";
import { createToken } from "../modules/Auth/auth.utils";
import config from "../config";
import { notifyStaff } from "../modules/Notification/notification.utils";

const generateOtp = async () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtpToEmail = async (payload: TOtp) => {
  const otp = await generateOtp();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000);
  payload.otp = otp;
  payload.expiresAt = expireAt;
  payload.role = USER_ROLE.customer;
  // Never store plaintext signup passwords in OTP collection.
  if (payload.password && !payload.password.startsWith("$2")) {
    payload.password = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_rounds),
    );
  }
  const result = await OtpModel.findOneAndUpdate(
    { email: payload.email },
    { ...payload },
    { new: true, upsert: true },
  );
  if (result) {
    const subject = "Easy Banking Registratin OTP";
    const html = `Here is your Easy Banking Registratin OTP: <h1>${otp}</h1> Please verify this OTP for registration`;
    const sendMail = await sendEmail(payload.email, subject, html);
    return { sendMail, email: result?.email };
  }
};

export const verifyOtpAndCreateUser = async (payload: {
  email: string;
  otp: string;
}) => {
  const { email, otp } = payload;
  const isUserExist = await OtpModel.findOne({ email: email });
  if (isUserExist) {
    const timeExpire = isUserExist.expiresAt < new Date();
    if (timeExpire) {
      await OtpModel.deleteOne({ email }); // Clean up
      throw new AppError(HttpStatus.BAD_REQUEST, "OTP expired");
    }
    if (isUserExist.otp !== otp) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Invalid OTP");
    }
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const userData = {
        email: isUserExist.email,
        name: isUserExist.name,
        role: isUserExist.role,
        password: isUserExist.password,
        profilePhotoUrl: isUserExist.profilePhotoUrl,
        phoneNumber: isUserExist.phoneNumber,
      };
      const newUser = await User.create([userData], { session });
      if (!newUser) {
        throw new AppError(HttpStatus.BAD_REQUEST, "New User creation failed");
      }

      await OtpModel.deleteOne({ email: newUser?.[0].email });

      const jwtPayload: JwtPayload = {
        user: newUser[0]._id,
        email: newUser[0].email,
        role: newUser[0].role,
        profilePhotoUrl: newUser[0].profilePhotoUrl,
        phoneNumber: newUser[0].phoneNumber,
        isDeleted: newUser[0].isDeleted,
      };
      const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string,
      );
      const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string,
      );

      await session.commitTransaction();
      await session.endSession();
      void notifyStaff({
        type: "user_registration",
        title: "New customer registered",
        message: `${newUser[0].name?.firstName || "A customer"} just joined EasyBank.`,
        data: { userId: newUser[0]._id },
      });
      return {
        accessToken,
        refreshToken,
        newUser,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      //   console.log(error);
      await session.abortTransaction();
      await session.endSession();
      throw new AppError(HttpStatus.BAD_REQUEST, "Failed to create the User");
    }
  } else {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong");
  }
};
