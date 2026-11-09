import { TErrorSource, TResponseErrorType } from "../interface/error";

export const handleDuplicateError = (err: any) : TResponseErrorType => {

    const match = err?.message.match(/"([^"]*)"/)
    const extracted_msg = match && match[1]

    const errorSource : TErrorSource = [
        {
            path: "",
            message: `${extracted_msg} is already exist`
        }
    ]

  const statusCode = 400;
  return {
    statusCode,
    message: "Invalid Id",
    errorSource,
  };
};
