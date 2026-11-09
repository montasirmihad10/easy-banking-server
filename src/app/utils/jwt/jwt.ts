/* eslint-disable no-console */
import jwt, {
  JsonWebTokenError,
  NotBeforeError,
  SignOptions,
  TokenExpiredError,
} from "jsonwebtoken";
import { Types } from "mongoose";

export interface JwtPayload {
  user: Types.ObjectId | string;
  email: string;
  role: string;
  profilePhotoUrl?: string;
  phoneNumber?: string;
  name?: string;
  isDeleted?: boolean;
  iat?: number;
  exp?: number;
}

export const createToken = (
  jwtPayload: JwtPayload,
  secretToken: string,
  expiry: string,
) => {
  return jwt.sign(jwtPayload, secretToken, {
    expiresIn: expiry,
  } as SignOptions);
};

export const verifyToken = (
  token: string,
  secret: string,
): JwtPayload | null => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.error("JWT Error: Token has expired");
    } else if (error instanceof JsonWebTokenError) {
      console.error("JWT Error: Invalid or malformed token");
    } else if (error instanceof NotBeforeError) {
      console.error("JWT Error: Token not active yet (nbf)");
    } else {
      console.error("JWT Unknown Error:", error);
    }
    return null;
  }
};
