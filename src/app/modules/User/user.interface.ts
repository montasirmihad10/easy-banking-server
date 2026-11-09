import { Model } from "mongoose";

export type TUserInterface = {
  // customerId?: string;
  // managerId?: string;
  // adminId?: string;
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
  password: string;
  role: string;
  isDeleted: boolean;
  profilePhotoUrl?: string;
  phoneNumber: string;
  fcmToken?: string[];
};

export interface TOtp {
  otp: string;
  expiresAt: Date;
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
  password: string;
  role: string;
  isDeleted: boolean;
  profilePhotoUrl?: string;
  phoneNumber: string;
}

export interface UserModel extends Model<TUserInterface> {
  isUserExistByEmail(email: string): Promise<TUserInterface>;
  compareUserPassword(
    payloadPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}
