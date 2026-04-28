import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db.js";
import { users } from "../../infrastructure/database/schema.js";
import type { CreateUserInput } from "./users.types.js";

export class UsersRepository {
  async create(input: CreateUserInput) {
    const [createdUser] = await db
      .insert(users)
      .values({
        fullName: input.fullName,
        fullNameAr: input.fullNameAr,
        businessName: input.businessName,
        businessNameAr: input.businessNameAr,
        businessType: input.businessType,
      })
      .returning();

    return createdUser;
  }

  async findAll() {
    return db.select().from(users);
  }

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }
}
