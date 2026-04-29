import { AppError } from "../../shared/errors/app-error.js";
import { toNumber } from "../../lib/utils/numbers.js";
import type { ClientRow, NewClientRow } from "../../infrastructure/database/schema.js";
import type { ClientsRepository, ClientSortKey } from "./clients.repository.js";

export interface ClientPayload {
  name: string;
  nameAr?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  companyAr?: string | null;
  notes?: string | null;
  riskLevel?: ClientRow["riskLevel"];
  riskScore?: number;
  totalInvoiced?: number;
  totalPaid?: number;
  totalOverdue?: number;
  avgPaymentDays?: number;
  invoicesCount?: number;
  latePaymentsCount?: number;
}

type ClientRecordInput = {
  name?: string;
  nameAr?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  companyAr?: string | null;
  notes?: string | null;
  riskLevel?: ClientRow["riskLevel"];
  riskScore?: string | number | null;
  totalInvoiced?: string | number | null;
  totalPaid?: string | number | null;
  totalOverdue?: string | number | null;
  avgPaymentDays?: number | string | null;
  invoicesCount?: number | string | null;
  latePaymentsCount?: number | string | null;
};

export interface ClientListQuery {
  riskLevel?: ClientRow["riskLevel"];
  sort?: ClientSortKey;
}

export class ClientsService {
  constructor(private readonly repository: ClientsRepository) {}

  list(query: ClientListQuery) {
    return this.repository.list(query);
  }

  async getById(id: string): Promise<ClientRow> {
    const client = await this.repository.findById(id);

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    return client;
  }

  async create(payload: ClientPayload): Promise<ClientRow> {
    return this.repository.create(this.buildRowPayload(payload));
  }

  async update(id: string, payload: Partial<ClientPayload>): Promise<ClientRow> {
    const existing = await this.getById(id);
    const updated = await this.repository.update(
      id,
      this.buildRowPayload({ ...existing, ...payload } as ClientRecordInput),
    );

    if (!updated) {
      throw new AppError("Client not found", 404);
    }

    return updated;
  }

  private buildRowPayload(
    payload: ClientPayload | ClientRecordInput,
  ): NewClientRow {
    const riskScoreValue =
      toNumber(payload.riskScore) ?? this.calculateRiskScore(payload);
    const riskLevel = payload.riskLevel ?? this.riskLevelFromScore(riskScoreValue);
    const totalInvoiced = toNumber(payload.totalInvoiced) ?? 0;
    const totalPaid = toNumber(payload.totalPaid) ?? 0;
    const totalOverdue = toNumber(payload.totalOverdue) ?? 0;
    const avgPaymentDays = Number(payload.avgPaymentDays ?? 0);
    const invoicesCount = Number(payload.invoicesCount ?? 0);
    const latePaymentsCount = Number(payload.latePaymentsCount ?? 0);

    return {
      name: String(payload.name ?? "").trim(),
      nameAr: this.optionalText(payload.nameAr),
      email: this.optionalText(payload.email),
      phone: this.optionalText(payload.phone),
      company: this.optionalText(payload.company),
      companyAr: this.optionalText(payload.companyAr),
      notes: this.optionalText(payload.notes),
      riskLevel,
      riskScore: riskScoreValue.toFixed(1),
      totalInvoiced: totalInvoiced.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalOverdue: totalOverdue.toFixed(2),
      avgPaymentDays: Math.trunc(avgPaymentDays),
      invoicesCount: Math.trunc(invoicesCount),
      latePaymentsCount: Math.trunc(latePaymentsCount),
    };
  }

  private optionalText(value: unknown): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  private calculateRiskScore(payload: ClientRecordInput): number {
    const totalOverdue = toNumber(payload.totalOverdue) ?? 0;
    const latePaymentsCount = Number(payload.latePaymentsCount ?? 0);
    const avgPaymentDays = Number(payload.avgPaymentDays ?? 0);

    const score = 2 + totalOverdue / 1000 + latePaymentsCount * 0.8 + avgPaymentDays / 30;

    return Math.max(0, Math.min(10, Number(score.toFixed(1))));
  }

  private riskLevelFromScore(score: number): ClientRow["riskLevel"] {
    if (score >= 7) {
      return "high";
    }

    if (score >= 4) {
      return "medium";
    }

    return "low";
  }
}
