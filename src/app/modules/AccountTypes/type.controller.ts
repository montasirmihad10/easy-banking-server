import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { getParam } from "../../utils/getParam";
import { typeServices } from "./type.service";

const getTypes = catchAsync(async (req, res) => {
  const result = await typeServices.getTypes();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Account Types retrieved succesfully",
    data: result,
  });
});

const getEachTypes = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await typeServices.getEachTypes(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Account Types retrieved succesfully",
    data: result,
  });
});

const updateType = catchAsync(async (req, res) => {
  const id = getParam(req, "id");
  const result = await typeServices.updateType(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Account Types updated succesfully",
    data: result,
  });
});

export const typeControllers = {
  getTypes,
  getEachTypes,
  updateType,
};
