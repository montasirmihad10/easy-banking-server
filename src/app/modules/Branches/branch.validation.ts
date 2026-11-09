import { z } from "zod";

const createBranchValidation = z.object({
  body: z.object({
    name: z.string(),
    code: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string().optional(),
    country: z.string(),
    zipCode: z.string(),
    contactNumber: z.string().optional(),
    email: z.email().optional(),
    managerName: z.string().optional(),
    openingSchedule: z.object({
      days: z.array(z.string()), // You can also add `.min(1)` if you want at least one day
      openTime: z.string(), // Consider stricter time validation with regex if needed
      closeTime: z.string(),
    }),
    branchOpenedAt: z.iso.date().optional(),
  }),
});

const updateBranchValidation = z.object({
  body: z
    .object({
      name: z.string().optional(),
      code: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipCode: z.string().optional(),
      contactNumber: z.string().optional(),
      email: z.email().optional(),
      openingSchedule: z
        .object({
          days: z.array(z.string()).optional(), // You can also add `.min(1)` if you want at least one day
          openTime: z.string().optional(), // Consider stricter time validation with regex if needed
          closeTime: z.string().optional(),
        })
        .optional(),
    })
});

export const branchValidations = {
  createBranchValidation,
  updateBranchValidation,
};
