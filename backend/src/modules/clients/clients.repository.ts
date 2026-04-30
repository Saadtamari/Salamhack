import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db.js";
import { clients, type ClientRow, type NewClientRow } from "../../infrastructure/database/schema.js";

export type ClientSortKey = "created_at" | "risk" | "payment_days" | "invoices_count";

export interface ListClientsOptions {
  riskLevel?: ClientRow["riskLevel"];
  sort?: ClientSortKey;
}

export class ClientsRepository {
  async list(options: ListClientsOptions = {}): Promise<ClientRow[]> {
    const filters = options.riskLevel ? eq(clients.riskLevel, options.riskLevel) : undefined;

    const orderBy = (() => {
      switch (options.sort) {
        case "risk":
          return [desc(clients.riskScore), asc(clients.name)];
        case "payment_days":
          return [desc(clients.avgPaymentDays), asc(clients.name)];
        case "invoices_count":
          return [desc(clients.invoicesCount), asc(clients.name)];
        default:
          return [desc(clients.createdAt)];
      }
    })();

    const query = db.select().from(clients);

    const rows = filters
      ? await query.where(and(filters)).orderBy(...orderBy)
      : await query.orderBy(...orderBy);

    return rows;
  }

  async findById(id: string): Promise<ClientRow | null> {
    const [row] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return row ?? null;
  }

  async create(input: NewClientRow): Promise<ClientRow> {
    const [row] = await db.insert(clients).values(input).returning();
    return row;
  }

  async update(id: string, input: Partial<NewClientRow>): Promise<ClientRow | null> {
    const [row] = await db.update(clients).set(input).where(eq(clients.id, id)).returning();
    return row ?? null;
  }
}
