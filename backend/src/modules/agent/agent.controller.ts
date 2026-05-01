import type { Request, Response } from "express";
import { z } from "zod";
import type { AgentService } from "./agent.service.js";
import { agentActionSchema, agentContextSchema, agentHistoryMessageSchema } from "./agent.schemas.js";

const boolishSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return value;
}, z.boolean());

const commandBodySchema = z.object({
  message: z.string().trim().min(1).optional(),
  context: agentContextSchema.optional(),
  history: z.array(agentHistoryMessageSchema).optional(),
  executeAction: boolishSchema.optional(),
  execute_action: boolishSchema.optional(),
  confirmation: z.object({
    approved: boolishSchema,
    action: agentActionSchema,
    idempotencyKey: z.string().trim().min(1).optional(),
  }).optional(),
});

export class AgentController {
  constructor(private readonly service: AgentService) {}

  async command(request: Request, response: Response): Promise<void> {
    const body = commandBodySchema.parse(request.body);
    const result = await this.service.run({
      message: body.message,
      context: body.context,
      history: body.history,
      executeAction: body.executeAction ?? body.execute_action,
      confirmation: body.confirmation,
    });

    response.json({
      success: true,
      data: result,
    });
  }
}
