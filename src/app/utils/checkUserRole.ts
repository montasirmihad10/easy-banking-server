import HttpStatus from "http-status";
import AppError from "../erros/AppError";
import { TJwtUser } from "../interface/global";

export const checkUserRole = async (user: TJwtUser) => {
  let query = {};

  if (user.role === "customer") {
    query = { customerId: user.user };
  } else if (user.role === "manager") {
    query = { managerId: user.user };
  } else if (user.role === "admin") {
    query = { adminId: user.user };
  } else {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid user role");
  }
  return query;
};
