import { z } from "zod";

const createUserValidation = z.object({
  body: z.object({
    name: z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
    }),
    email: z.email(),
    password: z.string().min(6),
    role: z.string().optional(),
    profilePhotoUrl: z.string().optional(),
    phoneNumber: z.string(),
  }),
});

export const userValidations = {
  createUserValidation,
};
