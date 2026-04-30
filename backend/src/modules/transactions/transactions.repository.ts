import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../infrastructure/database/db.js";
import { transactions, type NewTransactionRow, type TransactionRow } from "../../infrastructure/database/schema.js";

export interface ListTransactionsOptions {
  category?: TransactionRow["category"];
  from?: string;
  to?: string;
}

export class TransactionsRepository {
  async list(options: ListTransactionsOptions = {}): Promise<TransactionRow[]> {
    const conditions = [];

    if (options.category) {
      conditions.push(eq(transactions.category, options.category));
    }

    if (options.from) {
      conditions.push(gte(transactions.transactionDate, options.from));
    }

    if (options.to) {
      conditions.push(lte(transactions.transactionDate, options.to));
    }

    const rows = conditions.length > 0
      ? await db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
      : await db.select().from(transactions).orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));

    return rows;
  }

  async create(input: NewTransactionRow): Promise<TransactionRow> {
    const [row] = await db.insert(transactions).values(input).returning();
    return row;
  }
}
