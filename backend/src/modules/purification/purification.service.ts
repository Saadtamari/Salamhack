import { AppError } from "../../shared/errors/app-error.js";
import { toNumber } from "../../lib/utils/numbers.js";
import type { PurificationRecordRow, NewPurificationRecordRow } from "../../infrastructure/database/schema.js";
import type { PurificationRepository } from "./purification.repository.js";

export interface PurificationPayload {
  transactionId?: string | null;
  amount: number;
  reason?: string | null;
  reasonAr?: string | null;
  purified?: boolean;
  purifiedAt?: string | null;
  charityDestination?: string | null;
}

export class PurificationService {
  constructor(private readonly repository: PurificationRepository) {}

  list(query: { purified?: boolean }) {
    return this.repository.list(query);
  }

  async getById(id: string): Promise<PurificationRecordRow> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw new AppError("Purification record not found", 404);
    }

    return record;
  }

  async create(payload: PurificationPayload): Promise<PurificationRecordRow> {
    const amount = toNumber(payload.amount) ?? 0;

    if (amount <= 0) {
      throw new AppError("amount must be greater than 0", 400);
    }

    const purified = payload.purified ?? false;

    const row: NewPurificationRecordRow = {
      transactionId: payload.transactionId ?? null,
      amount: amount.toFixed(2),
      reason: payload.reason?.trim() || null,
      reasonAr: payload.reasonAr?.trim() || null,
      purified,
      purifiedAt: purified ? (payload.purifiedAt ? new Date(payload.purifiedAt) : new Date()) : null,
      charityDestination: payload.charityDestination?.trim() || null,
    };

    return this.repository.create(row);
  }

  async markPurified(id: string, charityDestination?: string): Promise<PurificationRecordRow> {
    const existing = await this.getById(id);

    if (existing.purified) {
      throw new AppError("Record is already purified", 400);
    }

    const updated = await this.repository.update(id, {
      purified: true,
      purifiedAt: new Date(),
      charityDestination: charityDestination?.trim() || existing.charityDestination,
    });

    if (!updated) {
      throw new AppError("Purification record not found", 404);
    }

    return updated;
  }

  async delete(id: string): Promise<PurificationRecordRow> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new AppError("Purification record not found", 404);
    }

    return deleted;
  }
}
