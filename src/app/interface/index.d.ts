import { JwtPayload } from "../utils/jwt/jwt";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export {};
