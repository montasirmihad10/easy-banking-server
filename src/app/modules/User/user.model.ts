import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import config from "../../config";
import { TOtp, TUserInterface, UserModel } from "./user.interface";

const userSchema = new Schema<TUserInterface, UserModel>(
  {
    // customerId: { type: String, unique: true, sparse: true },
    // managerId: { type: String, unique: true, sparse: true },
    // adminId: { type: String, unique: true, sparse: true },
    name: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
    },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String },
    isDeleted: { type: Boolean, default: false },
    profilePhotoUrl: { type: String },
    phoneNumber: { type: String },
    fcmToken: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  // Skip re-hash if password is already bcrypt (e.g. hashed during OTP storage).
  if (typeof this.password === "string" && this.password.startsWith("$2")) {
    return;
  }
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds),
  );
});

userSchema.statics.isUserExistByEmail = async function (email: string) {
  return await User.findOne({ email }).select("+password");
};

userSchema.statics.compareUserPassword = async function (
  payloadPassword: string,
  hashedPassword: string,
) {
  const compare = await bcrypt.compare(payloadPassword, hashedPassword);
  return compare;
};

export const User = model<TUserInterface, UserModel>("User", userSchema);

const otpSchema = new Schema<TOtp>({
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  name: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
  },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String },
  isDeleted: { type: Boolean, default: false },
  profilePhotoUrl: { type: String },
  phoneNumber: { type: String },
});

export const OtpModel = model<TOtp>("Otp", otpSchema);
