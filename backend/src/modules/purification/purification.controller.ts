import type { Request, Response } from "express";
import { z } from "zod";
import type { PurificationService } from "./purification.service.js";

const createBodySchema = z.object({
  transactionId: z.string().uuid().optional().nullable(),
  transaction_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive(),
  reason: z.string().trim().optional().nullable(),
  reasonAr: z.string().trim().optional().nullable(),
  reason_ar: z.string().trim().optional().nullable(),
  purified: z.coerce.boolean().optional(),
  purifiedAt: z.string().datetime().optional().nullable(),
  purified_at: z.string().datetime().optional().nullable(),
  charityDestination: z.string().trim().optional().nullable(),
  charity_destination: z.string().trim().optional().nullable(),
});

const purifyBodySchema = z.object({
  charityDestination: z.string().trim().optional(),
  charity_destination: z.string().trim().optional(),
});

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

const listQuerySchema = z.object({
  purified: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export class PurificationController {
  constructor(private readonly service: PurificationService) {}

  async list(request: Request, response: Response): Promise<void> {
    const query = listQuerySchema.parse(request.query);
    const records = await this.service.list({ purified: query.purified });

    response.json({
      success: true,
      data: records,
    });
  }

  async getById(request: Request, response: Response): Promise<void> {
    const { id } = paramsSchema.parse(request.params);
    const record = await this.service.getById(id);

    response.json({
      success: true,
      data: record,
    });
  }

  async create(request: Request, response: Response): Promise<void> {
    const body = createBodySchema.parse(request.body);
    const record = await this.service.create({
      transactionId: body.transactionId ?? body.transaction_id,
      amount: body.amount,
      reason: body.reason,
      reasonAr: body.reasonAr ?? body.reason_ar,
      purified: body.purified,
      purifiedAt: body.purifiedAt ?? body.purified_at,
      charityDestination: body.charityDestination ?? body.charity_destination,
    });

    response.status(201).json({
      success: true,
      data: record,
    });
  }

  async markPurified(request: Request, response: Response): Promise<void> {
    const { id } = paramsSchema.parse(request.params);
    const body = purifyBodySchema.parse(request.body);
    const record = await this.service.markPurified(
      id,
      body.charityDestination ?? body.charity_destination,
    );

    response.json({
      success: true,
      data: record,
    });
  }

  async delete(request: Request, response: Response): Promise<void> {
    const { id } = paramsSchema.parse(request.params);
    const record = await this.service.delete(id);

    response.json({
      success: true,
      data: record,
    });
  }
}
