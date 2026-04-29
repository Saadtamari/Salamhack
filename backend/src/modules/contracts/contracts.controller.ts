import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import type { ContractsService } from "./contracts.service.js";

const analysisStatusSchema = z.enum(["pending", "analyzing", "completed", "failed"]);

const contractQuerySchema = z.object({
  analysis_status: analysisStatusSchema.optional(),
  client_id: z.string().trim().min(1).optional(),
});

const contractParamsSchema = z.object({
  id: z.string().trim().min(1),
});

const contractBodySchema = z.object({
  clientId: z.string().trim().min(1).optional().nullable(),
  client_id: z.string().trim().min(1).optional().nullable(),
  title: z.string().trim().optional(),
  titleAr: z.string().trim().optional(),
  title_ar: z.string().trim().optional(),
});

export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  async list(request: Request, response: Response): Promise<void> {
    const query = contractQuerySchema.parse(request.query);
    const contracts = await this.service.list({
      analysisStatus: query.analysis_status,
      clientId: query.client_id,
    });

    response.json({ success: true, data: contracts });
  }

  async getById(request: Request, response: Response): Promise<void> {
    const { id } = contractParamsSchema.parse(request.params);
    const contract = await this.service.getById(id);

    response.json({ success: true, data: contract });
  }

  async create(request: Request, response: Response): Promise<void> {
    const file = request.file;

    if (!file) {
      throw new AppError("file is required", 400);
    }

    const body = contractBodySchema.parse(request.body);
    const contract = await this.service.createFromUpload({
      file,
      clientId: body.clientId ?? body.client_id,
      title: body.title,
      titleAr: body.titleAr ?? body.title_ar,
    });

    response.status(201).json({ success: true, data: contract });
  }

  async delete(request: Request, response: Response): Promise<void> {
    const { id } = contractParamsSchema.parse(request.params);
    const contract = await this.service.delete(id);

    response.json({ success: true, data: contract });
  }
}
