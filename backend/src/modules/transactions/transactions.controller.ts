import type { Request, Response } from "express";
import { z } from "zod";
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
}
