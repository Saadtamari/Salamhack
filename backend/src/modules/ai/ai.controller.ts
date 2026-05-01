import type { Request, Response } from "express";
import { z } from "zod";
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
    });

    response.json({
      success: true,
      data: result,
    });
  }

  async generateChaser(request: Request, response: Response): Promise<void> {
    const body = chaserBodySchema.parse(request.body);
    const result = await this.service.generateChaser({
      clientName: body.clientName ?? body.client_name!,
      invoiceNumber: body.invoiceNumber ?? body.invoice_number!,
      amount: body.amount,
      currency: body.currency,
      daysOverdue: body.daysOverdue ?? body.days_overdue!,
      dueDate: body.dueDate ?? body.due_date!,
    });

    response.json({
      success: true,
      data: result,
    });
  }

  async analyzeContract(request: Request, response: Response): Promise<void> {
    const body = contractAnalysisBodySchema.parse(request.body);
    const result = await this.service.analyzeContract({
      contractText: body.contractText ?? body.contract_text!,
      title: body.title,
    });

    response.json({
      success: true,
      data: result,
    });
  }
}
