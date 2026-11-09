import { z } from "zod";

export const createAccountValidation = z.object({
  body: z.object({
    accountNumber: z.string().optional(),
    user: z.string().optional(), // ObjectId as string
    customer: z.string().optional(),
    manager: z.string().optional(),
    admin: z.string().optional(),
    branch: z.string(),
    accountType: z.enum(["savings", "checking", "business"]).optional(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["Male", "Female", "Other"]),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

export const accountValidations = {
  createAccountValidation,
};
