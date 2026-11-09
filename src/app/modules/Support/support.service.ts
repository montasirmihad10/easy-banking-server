import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { TJwtUser } from "../../interface/global";
import { User } from "../User/user.model";
import {
  notifyStaff,
  sendNotification,
} from "../Notification/notification.utils";
import { ISupportTicket } from "./support.interface";
import { SupportTicketModel } from "./support.model";

const displayName = (user: {
  name?: { firstName?: string; lastName?: string };
  email?: string;
}) =>
  `${user?.name?.firstName || ""} ${user?.name?.lastName || ""}`.trim() ||
  user?.email ||
  "User";

const createTicket = async (
  user: TJwtUser,
  payload: Partial<ISupportTicket>,
) => {
  const dbUser = await User.findById(user.user);
  if (!dbUser) throw new AppError(HttpStatus.NOT_FOUND, "User not found");

  const ticket = await SupportTicketModel.create({
    user: dbUser._id,
    subject: payload.subject,
    description: payload.description,
    category: payload.category || "other",
    priority: payload.priority || "medium",
    status: "open",
    messages: [
      {
        sender: dbUser._id,
        senderRole: dbUser.role as "customer" | "manager" | "admin",
        senderName: displayName(dbUser),
        message: payload.description as string,
        createdAt: new Date(),
      },
    ],
    lastReplyAt: new Date(),
  });

  void notifyStaff({
    type: "support",
    title: "New support ticket",
    message: `${displayName(dbUser)} opened ${ticket.ticketNumber}: ${ticket.subject}`,
    data: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
    senderId: dbUser._id,
  });

  return ticket;
};

const createGuestTicket = async (payload: {
  guestName: string;
  guestEmail: string;
  subject: string;
  description: string;
  category?: ISupportTicket["category"];
  priority?: ISupportTicket["priority"];
}) => {
  const ticket = await SupportTicketModel.create({
    guestName: payload.guestName,
    guestEmail: payload.guestEmail.toLowerCase(),
    subject: payload.subject,
    description: payload.description,
    category: payload.category || "other",
    priority: payload.priority || "medium",
    status: "open",
    messages: [
      {
        sender: null,
        senderRole: "guest",
        senderName: payload.guestName,
        message: payload.description,
        createdAt: new Date(),
      },
    ],
    lastReplyAt: new Date(),
  });

  void notifyStaff({
    type: "support",
    title: "New guest support ticket",
    message: `${payload.guestName} opened ${ticket.ticketNumber}: ${ticket.subject}`,
    data: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
  });

  return ticket;
};

const getMyTickets = async (
  user: TJwtUser,
  query: Record<string, unknown>,
) => {
  const ticketQuery = new QueryBuilder(
    SupportTicketModel.find({ user: user.user }).sort({ updatedAt: -1 }),
    query,
  )
    .search(["subject", "description", "ticketNumber"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await ticketQuery.countTotal();
  const result = await ticketQuery.modelQuery;
  return { meta, result };
};

const getAllTickets = async (query: Record<string, unknown>) => {
  const ticketQuery = new QueryBuilder(
    SupportTicketModel.find()
      .sort({ updatedAt: -1 })
      .populate("user", "name email phoneNumber role")
      .populate("assignedTo", "name email role"),
    query,
  )
    .search(["subject", "description", "ticketNumber", "guestEmail", "guestName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await ticketQuery.countTotal();
  const result = await ticketQuery.modelQuery;
  return { meta, result };
};

const assertCanAccessTicket = async (ticketId: string, user: TJwtUser) => {
  const ticket = await SupportTicketModel.findById(ticketId)
    .populate("user", "name email phoneNumber role")
    .populate("assignedTo", "name email role")
    .populate("messages.sender", "name email role");

  if (!ticket) throw new AppError(HttpStatus.NOT_FOUND, "Ticket not found");

  if (user.role === "customer") {
    if (!ticket.user || String((ticket.user as { _id?: unknown })._id || ticket.user) !== String(user.user)) {
      throw new AppError(HttpStatus.FORBIDDEN, "Not authorized");
    }
  }

  return ticket;
};

const getTicketById = async (id: string, user: TJwtUser) => {
  return assertCanAccessTicket(id, user);
};

const replyToTicket = async (
  id: string,
  user: TJwtUser,
  message: string,
) => {
  const ticket = await SupportTicketModel.findById(id);
  if (!ticket) throw new AppError(HttpStatus.NOT_FOUND, "Ticket not found");

  const isStaff = user.role === "admin" || user.role === "manager";
  if (!isStaff) {
    if (!ticket.user || String(ticket.user) !== String(user.user)) {
      throw new AppError(HttpStatus.FORBIDDEN, "Not authorized");
    }
    if (ticket.status === "closed") {
      throw new AppError(HttpStatus.BAD_REQUEST, "This ticket is closed");
    }
  }

  const dbUser = await User.findById(user.user);
  if (!dbUser) throw new AppError(HttpStatus.NOT_FOUND, "User not found");

  ticket.messages.push({
    sender: dbUser._id,
    senderRole: dbUser.role as "customer" | "manager" | "admin",
    senderName: displayName(dbUser),
    message,
    createdAt: new Date(),
  });
  ticket.lastReplyAt = new Date();

  if (isStaff) {
    if (ticket.status === "open" || ticket.status === "waiting_customer") {
      ticket.status = "in_progress";
    }
    if (!ticket.assignedTo) ticket.assignedTo = dbUser._id;
  } else if (ticket.status === "resolved" || ticket.status === "waiting_customer") {
    ticket.status = "open";
  }

  await ticket.save();

  if (isStaff && ticket.user) {
    void sendNotification({
      recipientId: ticket.user,
      senderId: dbUser._id,
      type: "support",
      title: `Support reply · ${ticket.ticketNumber}`,
      message: message.slice(0, 120),
      data: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
    });
  } else if (!isStaff) {
    void notifyStaff({
      type: "support",
      title: `Customer reply · ${ticket.ticketNumber}`,
      message: `${displayName(dbUser)}: ${message.slice(0, 100)}`,
      data: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
      senderId: dbUser._id,
    });
  }

  return SupportTicketModel.findById(id)
    .populate("user", "name email phoneNumber role")
    .populate("assignedTo", "name email role")
    .populate("messages.sender", "name email role");
};

const updateTicket = async (
  id: string,
  user: TJwtUser,
  payload: Partial<ISupportTicket>,
) => {
  if (user.role !== "admin" && user.role !== "manager") {
    throw new AppError(HttpStatus.FORBIDDEN, "Not authorized");
  }

  const ticket = await SupportTicketModel.findById(id);
  if (!ticket) throw new AppError(HttpStatus.NOT_FOUND, "Ticket not found");

  const next: Partial<ISupportTicket> = {};
  if (payload.status) next.status = payload.status;
  if (payload.priority) next.priority = payload.priority;
  if (payload.category) next.category = payload.category;
  if (payload.assignedTo !== undefined) next.assignedTo = payload.assignedTo;
  if (payload.status === "closed" || payload.status === "resolved") {
    next.closedAt = new Date();
  }
  if (payload.status === "open" || payload.status === "in_progress") {
    next.closedAt = null;
  }
  if (!ticket.assignedTo && (user.role === "admin" || user.role === "manager")) {
    next.assignedTo = user.user as never;
  }

  const updated = await SupportTicketModel.findByIdAndUpdate(
    id,
    { $set: next },
    { new: true },
  )
    .populate("user", "name email phoneNumber role")
    .populate("assignedTo", "name email role");

  if (updated?.user && payload.status) {
    const recipientId =
      typeof updated.user === "object" && updated.user && "_id" in updated.user
        ? String((updated.user as { _id: unknown })._id)
        : String(updated.user);
    void sendNotification({
      recipientId,
      senderId: user.user,
      type: "support",
      title: `Ticket ${updated.ticketNumber} updated`,
      message: `Status is now ${payload.status.replace("_", " ")}.`,
      data: { ticketId: updated._id, ticketNumber: updated.ticketNumber },
    });
  }

  return updated;
};

export const supportServices = {
  createTicket,
  createGuestTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicket,
};
