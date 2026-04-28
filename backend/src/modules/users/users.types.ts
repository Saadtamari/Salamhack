export interface CreateUserInput {
  fullName: string;
  fullNameAr?: string;
  businessName?: string;
  businessNameAr?: string;
  businessType?: "freelancer" | "small_business" | "agency";
}
