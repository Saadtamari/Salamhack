import { toNumber } from "../../lib/utils/numbers.js";
import { groqAnalyzeReceiptImage, type GroqReceiptExtraction } from "../../infrastructure/ai/groq.js";
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

export interface ReceiptScanOptions {
  autoCreate?: boolean;
  fallbackCurrency?: string;
  fallbackDate?: string;
}

export interface ReceiptScanResult {
  extracted: GroqReceiptExtraction;
  suggestedTransaction: TransactionPayload | null;
  createdTransaction?: TransactionRow;
}

export class TransactionsService {
  constructor(private readonly repository: TransactionsRepository) {}

  list(query: TransactionListQuery) {
    return this.repository.list(query);
  }

  async create(payload: TransactionPayload): Promise<TransactionRow> {
    return this.repository.create(this.buildRowPayload(payload));
  }

  async scanReceipt(
    file: Express.Multer.File,
    options: ReceiptScanOptions = {},
  ): Promise<ReceiptScanResult> {
    const extracted = await groqAnalyzeReceiptImage(file.buffer, file.mimetype);
    const transactionDate = extracted.transactionDate ?? options.fallbackDate ?? new Date().toISOString().slice(0, 10);
    const currency = extracted.currency ?? options.fallbackCurrency ?? "USD";

    const suggestedTransaction = extracted.amount && extracted.amount > 0
      ? {
          type: "expense" as const,
          amount: extracted.amount,
          currency,
          category: extracted.category ?? "other",
          description: extracted.description,
          descriptionAr: extracted.descriptionAr,
          merchantName: extracted.merchantName,
          transactionDate,
          isHalal: extracted.isHalal,
          needsPurification: extracted.needsPurification,
        }
      : null;

    const result: ReceiptScanResult = {
      extracted,
      suggestedTransaction,
    };

    if (options.autoCreate && suggestedTransaction) {
      result.createdTransaction = await this.create(suggestedTransaction);
    }

    return result;
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
