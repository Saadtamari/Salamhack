import { z } from "zod";

export const agentPageSchema = z.enum([
  "dashboard",
  "invoices",
  "clients",
  "expenses",
  "zakat",
  "contracts",
  "reports",
]);

export const agentToolNameSchema = z.enum([
  "ui.navigate",
  "transactions.create",
  "transactions.list",
  "clients.create",
  "clients.find",
  "invoices.create_draft",
  "invoices.send",
  "invoices.send_reminder",
  "zakat.calculate",
  "reports.generate",
]);

export const agentActionSchema = z.object({
  tool: agentToolNameSchema,
  args: z.record(z.string(), z.unknown()).default({}),
});

export const agentContextSchema = z.object({
  screen: z.string().optional(),
  conversationId: z.string().trim().min(1).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const agentHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const agentConfirmationSchema = z.object({
  approved: z.boolean(),
  action: agentActionSchema,
  idempotencyKey: z.string().trim().min(1).optional(),
});

export const agentCommandInputSchema = z.object({
  message: z.string().trim().min(1).optional(),
  context: agentContextSchema.optional(),
  history: z.array(agentHistoryMessageSchema).optional(),
  executeAction: z.boolean().optional(),
  confirmation: agentConfirmationSchema.optional(),
});

export const agentPlanSchema = z.object({
  response: z.string().trim().min(1),
  responseEn: z.string().trim().optional(),
  intent: z.string().trim().optional(),
  confidence: z.coerce.number().min(0).max(1).default(0.5),
  action: agentActionSchema.nullable().default(null),
  missingFields: z.array(z.string()).default([]),
  requiresConfirmation: z.boolean().default(false),
  confirmationText: z.string().trim().optional(),
  targetScreen: agentPageSchema.optional(),
  suggestions: z.array(z.string()).default([]),
});

export type AgentPage = z.infer<typeof agentPageSchema>;
export type AgentToolName = z.infer<typeof agentToolNameSchema>;
export type AgentAction = z.infer<typeof agentActionSchema>;
export type AgentContext = z.infer<typeof agentContextSchema>;
export type AgentHistoryMessage = z.infer<typeof agentHistoryMessageSchema>;
export type AgentCommandInput = z.infer<typeof agentCommandInputSchema>;
export type AgentPlan = z.infer<typeof agentPlanSchema>;

export type AgentStatus =
  | "answer"
  | "planned"
  | "needs_clarification"
  | "needs_confirmation"
  | "executed"
  | "rejected"
  | "failed";

export interface AgentActionResult {
  executed: boolean;
  tool: AgentToolName;
  data?: unknown;
  message?: string;
  targetScreen?: AgentPage;
}

export interface AgentRunResult {
  status: AgentStatus;
  message: string;
  messageEn?: string;
  plan: AgentPlan;
  action?: AgentAction | null;
  actionResult?: AgentActionResult;
  suggestions: string[];
}
