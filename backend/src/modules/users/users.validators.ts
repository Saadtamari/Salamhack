import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(2),
  fullNameAr: z.string().optional(),
  businessName: z.string().optional(),
  businessNameAr: z.string().optional(),
  businessType: z.enum(["freelancer", "small_business", "agency"]).optional(),
});
