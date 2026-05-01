import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import type { AIService } from "./ai.service.js";

const chatBodySchema = z.object({
  message: z.string().trim().min(1, "message is required"),
  context: z
    .object({
      screen: z.string().optional(),
      data: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
  executeAction: z.coerce.boolean().optional(),
  execute_action: z.coerce.boolean().optional(),
});

const chaserBodySchema = z.object({
  clientName: z.string().trim().min(1).optional(),
  client_name: z.string().trim().min(1).optional(),
  invoiceNumber: z.string().trim().min(1).optional(),
  invoice_number: z.string().trim().min(1).optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().default("SAR"),
  daysOverdue: z.coerce.number().int().min(0).optional(),
  days_overdue: z.coerce.number().int().min(0).optional(),
  dueDate: z.string().trim().min(1).optional(),
  due_date: z.string().trim().min(1).optional(),
});

const contractAnalysisBodySchema = z.object({
  contractText: z.string().trim().min(1).optional(),
  contract_text: z.string().trim().min(1).optional(),
  title: z.string().trim().optional(),
});

export class AIController {
  constructor(private readonly service: AIService) {}

  async chat(request: Request, response: Response): Promise<void> {
    const body = chatBodySchema.parse(request.body);
    const result = await this.service.chat({
      message: body.message,
      context: body.context,
      history: body.history,
      executeAction: body.executeAction ?? body.execute_action,
    });

    response.json({
      success: true,
      data: result,
    });
  }

  async generateChaser(request: Request, response: Response): Promise<void> {
    const body = chaserBodySchema.parse(request.body);
    const clientName = body.clientName ?? body.client_name;
    const invoiceNumber = body.invoiceNumber ?? body.invoice_number;
    const daysOverdue = body.daysOverdue ?? body.days_overdue;
    const dueDate = body.dueDate ?? body.due_date;

    if (!clientName) {
      throw new AppError("clientName or client_name is required", 400);
    }

    if (!invoiceNumber) {
      throw new AppError("invoiceNumber or invoice_number is required", 400);
    }

    if (daysOverdue === undefined) {
      throw new AppError("daysOverdue or days_overdue is required", 400);
    }

    if (!dueDate) {
      throw new AppError("dueDate or due_date is required", 400);
    }

    const result = await this.service.generateChaser({
      clientName,
      invoiceNumber,
      amount: body.amount,
      currency: body.currency,
      daysOverdue,
      dueDate,
    });

    response.json({
      success: true,
      data: result,
    });
  }

  async analyzeContract(request: Request, response: Response): Promise<void> {
    const body = contractAnalysisBodySchema.parse(request.body);
    const contractText = body.contractText ?? body.contract_text;

    if (!contractText) {
      throw new AppError("contractText or contract_text is required", 400);
    }

    const result = await this.service.analyzeContract({
      contractText,
      title: body.title,
    });

    response.json({
      success: true,
      data: result,
    });
  }

  async scanReceipt(request: Request, response: Response): Promise<void> {
    const file = request.file;

    if (!file) {
      throw new AppError("Receipt image is required", 400);
    }

    if (!file.mimetype.startsWith("image/")) {
      throw new AppError("Receipt must be an image (jpg, png, webp)", 400);
    }

    const result = await this.service.scanReceipt(file.buffer, file.mimetype);

    response.json({
      success: true,
      data: result,
    });
  }
}
