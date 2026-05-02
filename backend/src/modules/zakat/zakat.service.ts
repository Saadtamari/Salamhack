import { AppError } from "../../shared/errors/app-error.js";
import { toNumber } from "../../lib/utils/numbers.js";
import type { NewZakatRecordRow, ZakatRecordRow } from "../../infrastructure/database/schema.js";
import type { ListZakatOptions, ZakatRepository } from "./zakat.repository.js";

export interface ZakatPayload {
  periodStart?: string;
  periodEnd?: string;
  totalIncome?: number;
  qualifyingAssets?: number;
  nisabThreshold?: number;
  zakatRate?: number;
  currency?: string;
  paid?: boolean;
  paidAt?: string | null;
  calculationDetails?: Record<string, unknown> | null;
}

export class ZakatService {
  constructor(private readonly repository: ZakatRepository) {}

  list(query: ListZakatOptions) {
    return this.repository.list(query);
  }

  async getById(id: string): Promise<ZakatRecordRow> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw new AppError("Zakat record not found", 404);
    }

    return record;
  }

  async calculate(payload: Required<Pick<ZakatPayload, "periodStart" | "periodEnd">> & ZakatPayload): Promise<ZakatRecordRow> {
    return this.repository.create(this.buildRecordPayload(payload));
  }

  async update(id: string, payload: ZakatPayload): Promise<ZakatRecordRow> {
    const existing = await this.getById(id);
    const updated = await this.repository.update(
      id,
      this.buildRecordPayload({
        periodStart: payload.periodStart ?? String(existing.periodStart),
        periodEnd: payload.periodEnd ?? String(existing.periodEnd),
        totalIncome: payload.totalIncome ?? toNumber(existing.totalIncome) ?? 0,
        qualifyingAssets: payload.qualifyingAssets ?? toNumber(existing.qualifyingAssets) ?? 0,
        nisabThreshold: payload.nisabThreshold ?? toNumber(existing.nisabThreshold) ?? 8400,
        zakatRate: payload.zakatRate ?? toNumber(existing.zakatRate) ?? 0.025,
        currency: payload.currency ?? existing.currency,
        paid: payload.paid ?? existing.paid,
        paidAt: payload.paidAt ?? (existing.paidAt ? new Date(existing.paidAt).toISOString() : null),
        calculationDetails: payload.calculationDetails ?? (existing.calculationDetails as Record<string, unknown> | null),
      }),
    );

    if (!updated) {
      throw new AppError("Zakat record not found", 404);
    }

    return updated;
  }

  async delete(id: string): Promise<ZakatRecordRow> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new AppError("Zakat record not found", 404);
    }

    return deleted;
  }

  private buildRecordPayload(payload: Required<Pick<ZakatPayload, "periodStart" | "periodEnd">> & ZakatPayload): NewZakatRecordRow {
    if (new Date(payload.periodEnd) < new Date(payload.periodStart)) {
      throw new AppError("periodEnd must be on or after periodStart", 400);
    }

    const totalIncome = toNumber(payload.totalIncome) ?? 0;
    const qualifyingAssets = toNumber(payload.qualifyingAssets) ?? totalIncome;
    const nisabThreshold = toNumber(payload.nisabThreshold) ?? 8400;
    const zakatRate = toNumber(payload.zakatRate) ?? 0.025;
    const aboveNisab = qualifyingAssets >= nisabThreshold;
    const zakatAmount = aboveNisab ? qualifyingAssets * zakatRate : 0;
    const paid = payload.paid ?? false;
    const paidAt = payload.paidAt ?? (paid ? new Date().toISOString() : null);

    return {
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      totalIncome: totalIncome.toFixed(2),
      qualifyingAssets: qualifyingAssets.toFixed(2),
      nisabThreshold: nisabThreshold.toFixed(2),
      aboveNisab,
      zakatRate: zakatRate.toFixed(4),
      zakatAmount: zakatAmount.toFixed(2),
      paid,
      paidAt: paidAt ? new Date(paidAt) : null,
      currency: payload.currency?.trim() || "USD",
      calculationDetails: {
        ...(payload.calculationDetails ?? {}),
        totalIncome,
        qualifyingAssets,
        nisabThreshold,
        zakatRate,
        aboveNisab,
        zakatAmount,
      },
    };
  }
}