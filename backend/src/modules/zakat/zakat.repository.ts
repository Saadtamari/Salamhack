import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../infrastructure/database/db.js";
import {
  zakatRecords,
  type NewZakatRecordRow,
  type ZakatRecordRow,
} from "../../infrastructure/database/schema.js";

export interface ListZakatOptions {
  from?: string;
  to?: string;
}

export class ZakatRepository {
  async list(options: ListZakatOptions = {}): Promise<ZakatRecordRow[]> {
    const conditions: any[] = [];

    if (options.from) {
      conditions.push(gte(zakatRecords.periodStart, options.from));
    }

    if (options.to) {
      conditions.push(lte(zakatRecords.periodEnd, options.to));
    }

    const query = db.select().from(zakatRecords);

    return conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(zakatRecords.createdAt))
      : await query.orderBy(desc(zakatRecords.createdAt));
  }

  async findById(id: string): Promise<ZakatRecordRow | null> {
    const [row] = await db.select().from(zakatRecords).where(eq(zakatRecords.id, id)).limit(1);
    return row ?? null;
  }

  async create(input: NewZakatRecordRow): Promise<ZakatRecordRow> {
    const [row] = await db.insert(zakatRecords).values(input).returning();
    return row;
  }

  async update(id: string, input: Partial<NewZakatRecordRow>): Promise<ZakatRecordRow | null> {
    const [row] = await db
      .update(zakatRecords)
      .set(input)
      .where(eq(zakatRecords.id, id))
      .returning();

    return row ?? null;
  }

  async delete(id: string): Promise<ZakatRecordRow | null> {
    const [row] = await db.delete(zakatRecords).where(eq(zakatRecords.id, id)).returning();
    return row ?? null;
  }
}