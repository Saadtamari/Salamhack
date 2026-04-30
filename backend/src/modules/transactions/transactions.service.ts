import { toNumber } from "../../lib/utils/numbers.js";
import type { NewTransactionRow, TransactionRow } from "../../infrastructure/database/schema.js";
import type { TransactionsRepository } from "./transactions.repository.js";

export interface TransactionPayload {
  type: TransactionRow["type"];
  amount: number;
  currency?: string;
  category?: TransactionRow["category"];
  description?: string | null;
  descriptionAr?: string | null;
  merchantName?: string | null;
  reference?: string | null;
  transactionDate: string;
  isHalal?: boolean;
  needsPurification?: boolean;
}

export interface TransactionListQuery {
  category?: TransactionRow["category"];
  from?: string;
  to?: string;
}

export class TransactionsService {
  constructor(private readonly repository: TransactionsRepository) {}

  list(query: TransactionListQuery) {
    return this.repository.list(query);
  }

  async create(payload: TransactionPayload): Promise<TransactionRow> {
    return this.repository.create(this.buildRowPayload(payload));
  }

  private buildRowPayload(payload: TransactionPayload): NewTransactionRow {
    return {
      type: payload.type,
      amount: toNumber(payload.amount)?.toFixed(2) ?? "0.00",
      currency: payload.currency?.trim() || "USD",
      category: payload.category,
      description: payload.description?.trim() || undefined,
      descriptionAr: payload.descriptionAr?.trim() || undefined,
      merchantName: payload.merchantName?.trim() || undefined,
      reference: payload.reference?.trim() || undefined,
      transactionDate: payload.transactionDate,
      isHalal: payload.isHalal ?? true,
      needsPurification: payload.needsPurification ?? false,
    };
  }
}
