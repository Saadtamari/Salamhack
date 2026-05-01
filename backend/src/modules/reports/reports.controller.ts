import type { Request, Response } from "express";
import { z } from "zod";
import type { ReportsService } from "./reports.service.js";

const listQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

const generateBodySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  async list(request: Request, response: Response): Promise<void> {
    const query = listQuerySchema.parse(request.query);
    const reports = await this.service.list(query);

    response.json({
      success: true,
      data: reports,
    });
  }

  async getById(request: Request, response: Response): Promise<void> {
    const { id } = paramsSchema.parse(request.params);
    const report = await this.service.getById(id);

    response.json({
      success: true,
      data: report,
    });
  }

  async generate(request: Request, response: Response): Promise<void> {
    const { month, year } = generateBodySchema.parse(request.body);
    const report = await this.service.generate(month, year);

    response.status(201).json({
      success: true,
      data: report,
    });
  }
}
