import HttpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../erros/AppError";
import config from "../config";
import { TJwtUser, TUserRole } from "../interface/global";
import { User } from "../modules/User/user.model";
import { verifyToken } from "../utils/jwt/jwt";

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.headers.authorization;
    if (!headerToken) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }

    // Support both "Bearer <token>" and raw token (existing client sends raw)
    const token = headerToken.startsWith("Bearer ")
      ? headerToken.split(" ")[1]
      : headerToken;

    if (!token) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }

    const decoded = verifyToken(
      token,
      config.jwt_access_secret as string,
    ) as TJwtUser | null;

    if (!decoded) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const { email } = decoded;

    if (!email) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "User email missing in token");
    }

    const user = await User.isUserExistByEmail(email);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
    }
    if (user?.isDeleted) {
      throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
    }

    // Always authorize against DB role (token role can be stale after promotion/demotion).
    const dbRole = user.role as TUserRole;
    if (requiredRoles.length && !requiredRoles.includes(dbRole)) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }

    const dbUser = user as unknown as TJwtUser & { _id: TJwtUser["user"] };
    req.user = {
      ...decoded,
      user: dbUser._id,
      role: dbRole,
      email: dbUser.email,
      isDeleted: Boolean(dbUser.isDeleted),
    } as never;
    next();
  });
};

export default auth;
