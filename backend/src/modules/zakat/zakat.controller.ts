import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import type { ZakatService } from "./zakat.service.js";

const zakatPayloadSchema = z.object({
  periodStart: z.string().date().optional(),
  period_start: z.string().date().optional(),
  periodEnd: z.string().date().optional(),
  period_end: z.string().date().optional(),
  totalIncome: z.coerce.number().min(0).optional(),
  total_income: z.coerce.number().min(0).optional(),
  qualifyingAssets: z.coerce.number().min(0).optional(),
  qualifying_assets: z.coerce.number().min(0).optional(),
  nisabThreshold: z.coerce.number().min(0).optional(),
  nisab_threshold: z.coerce.number().min(0).optional(),
  zakatRate: z.coerce.number().min(0).max(1).optional(),
  zakat_rate: z.coerce.number().min(0).max(1).optional(),
  currency: z.string().trim().min(1).optional(),
  paid: z.coerce.boolean().optional(),
  paidAt: z.string().datetime().optional().nullable(),
  paid_at: z.string().datetime().optional().nullable(),
  calculationDetails: z.record(z.string(), z.unknown()).optional(),
  calculation_details: z.record(z.string(), z.unknown()).optional(),
});

const updateZakatSchema = zakatPayloadSchema.partial();

const zakatParamsSchema = z.object({
  id: z.string().trim().min(1),
});

const listZakatQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

function normalizePayload(input: z.infer<typeof zakatPayloadSchema>) {
  const periodStart = input.periodStart ?? input.period_start;
  const periodEnd = input.periodEnd ?? input.period_end;

  if (!periodStart || !periodEnd) {
    throw new AppError("periodStart and periodEnd are required", 400);
  }

  return {
    periodStart,
    periodEnd,
    totalIncome: input.totalIncome ?? input.total_income,
    qualifyingAssets: input.qualifyingAssets ?? input.qualifying_assets,
    nisabThreshold: input.nisabThreshold ?? input.nisab_threshold,
    zakatRate: input.zakatRate ?? input.zakat_rate,
    currency: input.currency,
    paid: input.paid,
    paidAt: input.paidAt ?? input.paid_at,
    calculationDetails: input.calculationDetails ?? input.calculation_details,
  };
}

function normalizeUpdatePayload(input: z.infer<typeof updateZakatSchema>) {
  return {
    periodStart: input.periodStart ?? input.period_start,
    periodEnd: input.periodEnd ?? input.period_end,
    totalIncome: input.totalIncome ?? input.total_income,
    qualifyingAssets: input.qualifyingAssets ?? input.qualifying_assets,
    nisabThreshold: input.nisabThreshold ?? input.nisab_threshold,
    zakatRate: input.zakatRate ?? input.zakat_rate,
    currency: input.currency,
    paid: input.paid,
    paidAt: input.paidAt ?? input.paid_at,
    calculationDetails: input.calculationDetails ?? input.calculation_details,
  };
}

export class ZakatController {
  constructor(private readonly service: ZakatService) {}

  async list(request: Request, response: Response): Promise<void> {
    const query = listZakatQuerySchema.parse(request.query);
    const records = await this.service.list(query);

    response.json({
      success: true,
      data: records,
    });
  }

  async getById(request: Request, response: Response): Promise<void> {
    const { id } = zakatParamsSchema.parse(request.params);
    const record = await this.service.getById(id);

    response.json({
      success: true,
      data: record,
    });
  }

  async calculate(request: Request, response: Response): Promise<void> {
    const payload = normalizePayload(zakatPayloadSchema.parse(request.body));
    const record = await this.service.calculate(payload);

    response.status(201).json({
      success: true,
      data: record,
    });
  }

  async update(request: Request, response: Response): Promise<void> {
    const { id } = zakatParamsSchema.parse(request.params);
    const payload = normalizeUpdatePayload(updateZakatSchema.parse(request.body));
    const record = await this.service.update(id, payload);

    response.json({
      success: true,
      data: record,
    });
  }

  async delete(request: Request, response: Response): Promise<void> {
    const { id } = zakatParamsSchema.parse(request.params);
    const record = await this.service.delete(id);

    response.json({
      success: true,
      data: record,
    });
  }
}