import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import type { ClientsService } from "./clients.service.js";

const riskLevelSchema = z.enum(["low", "medium", "high"]);
const sortSchema = z.enum(["created_at", "risk", "payment_days", "invoices_count"]);

const clientBodySchema = z.object({
  name: z.string().trim().optional(),
  full_name: z.string().trim().optional(),
  fullName: z.string().trim().optional(),
  nameAr: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  companyAr: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  riskLevel: riskLevelSchema.optional(),
  riskScore: z.coerce.number().min(0).max(10).optional(),
  totalInvoiced: z.coerce.number().min(0).optional(),
  totalPaid: z.coerce.number().min(0).optional(),
  totalOverdue: z.coerce.number().min(0).optional(),
  avgPaymentDays: z.coerce.number().int().min(0).optional(),
  invoicesCount: z.coerce.number().int().min(0).optional(),
  latePaymentsCount: z.coerce.number().int().min(0).optional(),
});

const updateClientSchema = clientBodySchema.partial();

const clientParamsSchema = z.object({
  id: z.string().trim().min(1),
});

const listClientsQuerySchema = z.object({
  risk_level: riskLevelSchema.optional(),
  sort: sortSchema.optional(),
});

function normalizeClientPayload(input: z.infer<typeof clientBodySchema>) {
  const name = input.name ?? input.full_name ?? input.fullName;

  if (!name || name.trim().length === 0) {
    throw new AppError("name is required", 400);
  }

  return {
    name: name.trim(),
    nameAr: input.nameAr,
    email: input.email,
    phone: input.phone,
    company: input.company,
    companyAr: input.companyAr,
    notes: input.notes,
    riskLevel: input.riskLevel,
    riskScore: input.riskScore,
    totalInvoiced: input.totalInvoiced,
    totalPaid: input.totalPaid,
    totalOverdue: input.totalOverdue,
    avgPaymentDays: input.avgPaymentDays,
    invoicesCount: input.invoicesCount,
    latePaymentsCount: input.latePaymentsCount,
  };
}

function normalizePartialClientPayload(input: z.infer<typeof updateClientSchema>) {
  const payload: Partial<ReturnType<typeof normalizeClientPayload>> = {
    name: input.name ?? input.full_name ?? input.fullName,
    nameAr: input.nameAr,
    email: input.email,
    phone: input.phone,
    company: input.company,
    companyAr: input.companyAr,
    notes: input.notes,
    riskLevel: input.riskLevel,
    riskScore: input.riskScore,
    totalInvoiced: input.totalInvoiced,
    totalPaid: input.totalPaid,
    totalOverdue: input.totalOverdue,
    avgPaymentDays: input.avgPaymentDays,
    invoicesCount: input.invoicesCount,
    latePaymentsCount: input.latePaymentsCount,
  };

  return payload;
}

export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  async list(request: Request, response: Response): Promise<void> {
    const query = listClientsQuerySchema.parse(request.query);
    const clients = await this.service.list({
      riskLevel: query.risk_level,
      sort: query.sort,
    });

    response.json({
      success: true,
      data: clients,
    });
  }

  async getById(request: Request, response: Response): Promise<void> {
    const { id } = clientParamsSchema.parse(request.params);
    const client = await this.service.getById(id);

    response.json({
      success: true,
      data: client,
    });
  }

  async create(request: Request, response: Response): Promise<void> {
    const payload = normalizeClientPayload(clientBodySchema.parse(request.body));
    const client = await this.service.create(payload);

    response.status(201).json({
      success: true,
      data: client,
    });
  }

  async update(request: Request, response: Response): Promise<void> {
    const { id } = clientParamsSchema.parse(request.params);
    const payload = normalizePartialClientPayload(updateClientSchema.parse(request.body));
    const client = await this.service.update(id, payload);

    response.json({
      success: true,
      data: client,
    });
  }
}
