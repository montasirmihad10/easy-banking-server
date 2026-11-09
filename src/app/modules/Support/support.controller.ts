import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { getParam } from "../../utils/getParam";
import { TJwtUser } from "../../interface/global";
import { supportServices } from "./support.service";

const createTicket = catchAsync(async (req, res) => {
  const result = await supportServices.createTicket(
    req.user as TJwtUser,
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Support ticket created successfully",
    data: result,
  });
});

const createGuestTicket = catchAsync(async (req, res) => {
  const result = await supportServices.createGuestTicket(req.body);
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Support request submitted successfully",
    data: {
      ticketNumber: result.ticketNumber,
      _id: result._id,
      status: result.status,
    },
  });
});

const getMyTickets = catchAsync(async (req, res) => {
  const result = await supportServices.getMyTickets(
    req.user as TJwtUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Support tickets retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getAllTickets = catchAsync(async (req, res) => {
  const result = await supportServices.getAllTickets(req.query);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Support tickets retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getTicketById = catchAsync(async (req, res) => {
  const result = await supportServices.getTicketById(
    getParam(req, "id"),
    req.user as TJwtUser,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Support ticket retrieved successfully",
    data: result,
  });
});

const replyToTicket = catchAsync(async (req, res) => {
  const result = await supportServices.replyToTicket(
    getParam(req, "id"),
    req.user as TJwtUser,
    req.body.message,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Reply sent successfully",
    data: result,
  });
});

const updateTicket = catchAsync(async (req, res) => {
  const result = await supportServices.updateTicket(
    getParam(req, "id"),
    req.user as TJwtUser,
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Support ticket updated successfully",
    data: result,
  });
});

export const supportControllers = {
  createTicket,
  createGuestTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicket,
};
