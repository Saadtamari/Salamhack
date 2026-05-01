import { and, desc, eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db.js";
import {
  purificationRecords,
  type PurificationRecordRow,
  type NewPurificationRecordRow,
} from "../../infrastructure/database/schema.js";

export interface ListPurificationOptions {
  purified?: boolean;
}

export class PurificationRepository {
  async list(options: ListPurificationOptions = {}): Promise<PurificationRecordRow[]> {
    const query = db.select().from(purificationRecords);

    if (options.purified !== undefined) {
      return query
        .where(eq(purificationRecords.purified, options.purified))
        .orderBy(desc(purificationRecords.createdAt));
    }

    return query.orderBy(desc(purificationRecords.createdAt));
  }

  async findById(id: string): Promise<PurificationRecordRow | null> {
    const [row] = await db
      .select()
      .from(purificationRecords)
      .where(eq(purificationRecords.id, id))
      .limit(1);
    return row ?? null;
  }

  async create(input: NewPurificationRecordRow): Promise<PurificationRecordRow> {
    const [row] = await db.insert(purificationRecords).values(input).returning();
    return row;
  }

  async update(id: string, input: Partial<NewPurificationRecordRow>): Promise<PurificationRecordRow | null> {
    const [row] = await db
      .update(purificationRecords)
      .set(input)
      .where(eq(purificationRecords.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<PurificationRecordRow | null> {
    const [row] = await db
      .delete(purificationRecords)
      .where(eq(purificationRecords.id, id))
      .returning();
    return row ?? null;
  }
}
