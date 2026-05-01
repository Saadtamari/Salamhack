import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import type { TransactionsService } from "./transactions.service.js";

const transactionTypeSchema = z.enum(["income", "expense"]);
const categorySchema = z.enum([
  "food_dining",
  "transport",
  "software_tools",
  "office_supplies",
  "communication",
  "marketing",
  "education",
  "health",
  "rent",
  "utilities",
  "entertainment",
  "other",
]);

const transactionPayloadSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().positive(),
  currency: z.string().trim().min(1).optional(),
  category: categorySchema.optional(),
  description: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  merchantName: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  transactionDate: z.string().date(),
  isHalal: z.coerce.boolean().optional(),
  needsPurification: z.coerce.boolean().optional(),
});

const listTransactionsQuerySchema = z.object({
  category: categorySchema.optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

const scanReceiptBodySchema = z.object({
  autoCreate: z.coerce.boolean().optional(),
  auto_create: z.coerce.boolean().optional(),
  fallbackCurrency: z.string().trim().min(1).optional(),
  fallback_currency: z.string().trim().min(1).optional(),
  fallbackDate: z.string().date().optional(),
  fallback_date: z.string().date().optional(),
});

export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  async list(request: Request, response: Response): Promise<void> {
    const query = listTransactionsQuerySchema.parse(request.query);

    const transactions = await this.service.list(query);

    response.json({
      success: true,
      data: transactions,
    });
  }

  async create(request: Request, response: Response): Promise<void> {
    const payload = transactionPayloadSchema.parse(request.body);
    const transaction = await this.service.create(payload);

    response.status(201).json({
      success: true,
      data: transaction,
    });
  }

  async scanReceipt(request: Request, response: Response): Promise<void> {
    const file = this.getUploadedReceipt(request);
    const body = scanReceiptBodySchema.parse(request.body);
    const result = await this.service.scanReceipt(file, {
      autoCreate: body.autoCreate ?? body.auto_create,
      fallbackCurrency: body.fallbackCurrency ?? body.fallback_currency,
      fallbackDate: body.fallbackDate ?? body.fallback_date,
    });

    response.status(result.createdTransaction ? 201 : 200).json({
      success: true,
      data: result,
    });
  }

  private getUploadedReceipt(request: Request): Express.Multer.File {
    if (request.file) {
      return request.file;
    }

    const files = request.files as Record<string, Express.Multer.File[]> | undefined;
    const file = files?.image?.[0] ?? files?.receipt?.[0] ?? files?.file?.[0];

    if (!file) {
      throw new AppError("receipt image is required", 400);
    }

    return file;
  }
}
