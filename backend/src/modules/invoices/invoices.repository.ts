import { and, desc, eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db.js";
import {
  invoiceItems,
  invoices,
  type InvoiceItemRow,
  type InvoiceRow,
  type NewInvoiceItemRow,
  type NewInvoiceRow,
} from "../../infrastructure/database/schema.js";

export type InvoiceSortKey = "created_at" | "due_date" | "status" | "total";

export interface ListInvoicesOptions {
  status?: InvoiceRow["status"];
  clientId?: string;
  sort?: InvoiceSortKey;
}

export interface InvoiceWithItems extends InvoiceRow {
  items: InvoiceItemRow[];
}

export class InvoicesRepository {
  async list(options: ListInvoicesOptions = {}): Promise<InvoiceRow[]> {
    const conditions = [] as Array<ReturnType<typeof eq>>;

    if (options.status) {
      conditions.push(eq(invoices.status, options.status));
    }

    if (options.clientId) {
      conditions.push(eq(invoices.clientId, options.clientId));
    }

    const orderBy = (() => {
      switch (options.sort) {
        case "due_date":
          return [desc(invoices.dueDate), desc(invoices.createdAt)];
        case "status":
          return [desc(invoices.status), desc(invoices.createdAt)];
        case "total":
          return [desc(invoices.total), desc(invoices.createdAt)];
        default:
          return [desc(invoices.createdAt)];
      }
    })();

    const query = db.select().from(invoices);
    return conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(...orderBy)
      : await query.orderBy(...orderBy);
  }

  async findById(id: string): Promise<InvoiceRow | null> {
    const [row] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return row ?? null;
  }

  async getItems(invoiceId: string): Promise<InvoiceItemRow[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async findByIdWithItems(id: string): Promise<InvoiceWithItems | null> {
    const invoice = await this.findById(id);

    if (!invoice) {
      return null;
    }

    const items = await this.getItems(id);

    return { ...invoice, items };
  }

  async nextInvoiceNumber(prefix: string): Promise<string> {
    const rows = await db.select({ id: invoices.id }).from(invoices);
    const nextSequence = String(rows.length + 1).padStart(3, "0");
    return `${prefix}-${nextSequence}`;
  }

  async create(input: NewInvoiceRow, items: NewInvoiceItemRow[]): Promise<InvoiceWithItems> {
    return db.transaction(async (transaction) => {
      const [invoice] = await transaction.insert(invoices).values(input).returning();

      if (items.length > 0) {
        await transaction.insert(invoiceItems).values(
          items.map((item) => ({ ...item, invoiceId: invoice.id })),
        );
      }

      const createdItems = await transaction
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id));

      return { ...invoice, items: createdItems };
    });
  }

  async update(
    id: string,
    input: Partial<NewInvoiceRow>,
    items?: NewInvoiceItemRow[],
  ): Promise<InvoiceWithItems | null> {
    return db.transaction(async (transaction) => {
      const [invoice] = await transaction
        .update(invoices)
        .set(input)
        .where(eq(invoices.id, id))
        .returning();

      if (!invoice) {
        return null;
      }

      if (items) {
        await transaction.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        if (items.length > 0) {
          await transaction.insert(invoiceItems).values(
            items.map((item) => ({ ...item, invoiceId: id })),
          );
        }
      }

      const updatedItems = await transaction
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      return { ...invoice, items: updatedItems };
    });
  }

  async cancel(id: string): Promise<InvoiceRow | null> {
    const [invoice] = await db
      .update(invoices)
      .set({ status: "cancelled" })
      .where(eq(invoices.id, id))
      .returning();

    return invoice ?? null;
  }
}
