import { Request } from "express";

/** Express 5 types params as string | string[]; normalize to a single string */
export const getParam = (req: Request, key: string): string => {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
};
