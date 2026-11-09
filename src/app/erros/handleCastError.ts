import mongoose from "mongoose";
import { TErrorSource, TResponseErrorType } from "../interface/error";

export const handleCastError = (
  err: mongoose.Error.CastError,
): TResponseErrorType => {
  const errorSource: TErrorSource = [
    {
      path: err?.path,
      message: err?.message,
    },
  ];

  const statusCode = 400;
  return {
    statusCode,
    message: "Invalid Id",
    errorSource,
  };
};
