import { cerebrasChatCompletion, type ChatMessage } from "../../infrastructure/ai/cerebras.js";
import { DashboardService } from "../dashboard/dashboard.service.js";
import { AGENT_SYSTEM_PROMPT } from "./agent.prompt.js";
import {
  agentPlanSchema,
  type AgentAction,
  type AgentCommandInput,
  type AgentPlan,
  type AgentRunResult,
} from "./agent.schemas.js";
import { AgentExecutor } from "./agent.executor.js";
import { agentConversationMemory, mergeHistories } from "./agent.memory.js";

export class AgentService {
  private readonly executor = new AgentExecutor();
  private readonly dashboardService = new DashboardService();

  async run(input: AgentCommandInput): Promise<AgentRunResult> {
    const conversationId = input.context?.conversationId;
    const memory = agentConversationMemory.get(conversationId);
    const history = mergeHistories(memory?.history, input.history);
    const inputWithHistory = { ...input, history };
    let result: AgentRunResult;

    if (input.confirmation) {
      result = await this.handleConfirmation(input.confirmation.approved, input.confirmation.action);
      this.remember(conversationId, input, result, { clearPendingAction: true });
      return result;
    }

    if (!input.message) {
      result = this.emptyResult("Tell me what you want Masraf to do.");
      this.remember(conversationId, input, result);
      return result;
    }

    const pendingDecision = this.resolvePendingDecision(input.message, memory?.pendingAction);
    if (pendingDecision) {
      result = await this.handleConfirmation(pendingDecision.approved, pendingDecision.action);
      this.remember(conversationId, input, result, { clearPendingAction: true });
      return result;
    }

    const plan = await this.plan(inputWithHistory);

    if (!plan.action) {
      result = {
        status: plan.missingFields.length > 0 ? "needs_clarification" : "answer",
        message: plan.response,
        messageEn: plan.responseEn,
        plan,
        action: null,
        suggestions: plan.suggestions,
      };
      this.remember(conversationId, input, result);
      return result;
    }

    const validation = this.executor.validate(plan.action);
    if (!validation.ok) {
      const clarifiedPlan: AgentPlan = {
        ...plan,
        action: null,
        missingFields: [...new Set([...plan.missingFields, ...validation.missingFields])],
        requiresConfirmation: false,
      };

      result = {
        status: "needs_clarification",
        message: plan.response || `I need: ${validation.missingFields.join(", ")}.`,
        messageEn: plan.responseEn,
        plan: clarifiedPlan,
        action: null,
        suggestions: plan.suggestions,
      };
      this.remember(conversationId, input, result);
      return result;
    }

    const action = validation.action;
    const requiresConfirmation = this.executor.requiresConfirmation(action.tool) || plan.requiresConfirmation;
    const guardedPlan: AgentPlan = {
      ...plan,
      action,
      requiresConfirmation,
      confirmationText: requiresConfirmation
        ? plan.confirmationText ?? this.buildConfirmationText(action)
        : plan.confirmationText,
    };

    if (requiresConfirmation) {
      result = {
        status: "needs_confirmation",
        message: guardedPlan.confirmationText ?? guardedPlan.response,
        messageEn: guardedPlan.responseEn,
        plan: guardedPlan,
        action,
        suggestions: guardedPlan.suggestions,
      };
      this.remember(conversationId, input, result, { pendingAction: action });
      return result;
    }

    if (input.executeAction) {
      const actionResult = await this.executor.execute(action);
      result = {
        status: actionResult.executed ? "executed" : "failed",
        message: actionResult.message ?? guardedPlan.response,
        messageEn: guardedPlan.responseEn,
        plan: guardedPlan,
        action,
        actionResult,
        suggestions: guardedPlan.suggestions,
      };
      this.remember(conversationId, input, result, { clearPendingAction: true });
      return result;
    }

    result = {
      status: "planned",
      message: guardedPlan.response,
      messageEn: guardedPlan.responseEn,
      plan: guardedPlan,
      action,
      suggestions: guardedPlan.suggestions,
    };
    this.remember(conversationId, input, result);
    return result;
  }

  async plan(input: AgentCommandInput): Promise<AgentPlan> {
    const messages: ChatMessage[] = [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
    ];

    const sessionSnapshot = this.stringifySessionSnapshot(input.context?.data);
    if (sessionSnapshot) {
      messages.push({
        role: "system",
        content: `Frontend session snapshot. Treat this as the source of truth for the current app session because there may be no logged-in account yet. Use it for read-only answers, entity resolution, amounts, balances, invoices, clients, expenses, zakat, and contracts. Do not ask for information that is already present here:\n${sessionSnapshot}`,
      });
    }

    const fallbackSnapshot = sessionSnapshot ? null : await this.getDataSnapshot();
    if (fallbackSnapshot) {
      messages.push({
        role: "system",
        content: `Live app snapshot. Use this only for read-only answers and entity resolution. Do not invent values outside it:\n${fallbackSnapshot}`,
      });
    }

    if (input.context) {
      messages.push({
        role: "system",
        content: `Current UI context: ${JSON.stringify({ screen: input.context.screen })}`,
      });
    }

    for (const item of input.history?.slice(-8) ?? []) {
      messages.push({ role: item.role, content: item.content });
    }

    messages.push({ role: "user", content: input.message ?? "" });

    try {
      const result = await cerebrasChatCompletion(messages, {
        temperature: 0.1,
        maxTokens: 900,
        maxRetries: 0,
        timeoutMs: 12_000,
      });
      const content = result.choices[0]?.message?.content ?? "{}";
      return this.parsePlan(content);
    } catch (error) {
      console.warn("[agent] Planning failed:", error instanceof Error ? error.message : error);
      return {
        response: "The AI planner is unavailable right now. Try again in a moment.",
        responseEn: "The AI planner is unavailable right now.",
        confidence: 0,
        action: null,
        missingFields: [],
        requiresConfirmation: false,
        suggestions: ["Try again", "Open dashboard"],
      };
    }
  }

  private async handleConfirmation(approved: boolean, action: AgentAction): Promise<AgentRunResult> {
    const basePlan: AgentPlan = {
      response: approved ? "Confirmed." : "Cancelled.",
      confidence: 1,
      action,
      missingFields: [],
      requiresConfirmation: false,
      suggestions: [],
    };

    if (!approved) {
      return {
        status: "rejected",
        message: "Cancelled.",
        plan: basePlan,
        action,
        suggestions: [],
      };
    }

    const actionResult = await this.executor.execute(action);
    return {
      status: actionResult.executed ? "executed" : "failed",
      message: actionResult.message ?? (actionResult.executed ? "Done." : "Could not complete that action."),
      plan: basePlan,
      action,
      actionResult,
      suggestions: [],
    };
  }

  private parsePlan(content: string): AgentPlan {
    try {
      return agentPlanSchema.parse(normalizePlanPayload(parsePlannerJson(content)));
    } catch (error) {
      console.warn("[agent] Invalid plan JSON:", error instanceof Error ? error.message : error);
      return {
        response: "I could not safely understand that command. Please say it again with the amount, client, or action clearly.",
        responseEn: "I could not safely understand that command.",
        confidence: 0,
        action: null,
        missingFields: ["command"],
        requiresConfirmation: false,
        suggestions: ["Try again", "Open dashboard"],
      };
    }
  }

  private async getDataSnapshot(): Promise<string | null> {
    try {
      const stats = await withTimeout(this.dashboardService.getStats(), 1500);
      return JSON.stringify({
        totals: {
          balance: stats.totalBalance,
          income: stats.totalIncome,
          expenses: stats.totalExpenses,
          netProfit: stats.netProfit,
        },
        invoices: stats.invoices,
        clients: stats.clients,
        zakat: stats.zakat,
        purification: stats.purification,
        recentTransactions: stats.recentTransactions.slice(0, 5),
        overdueInvoices: stats.overdueInvoices.slice(0, 5),
      });
    } catch (error) {
      console.warn("[agent] Failed to load app snapshot:", error instanceof Error ? error.message : error);
      return null;
    }
  }

  private stringifySessionSnapshot(data: Record<string, unknown> | undefined): string | null {
    if (!data || typeof data !== "object") {
      return null;
    }

    try {
      return JSON.stringify(data);
    } catch {
      return null;
    }
  }

  private emptyResult(message: string): AgentRunResult {
    const plan: AgentPlan = {
      response: message,
      confidence: 0,
      action: null,
      missingFields: ["message"],
      requiresConfirmation: false,
      suggestions: [],
    };

    return {
      status: "needs_clarification",
      message,
      plan,
      action: null,
      suggestions: [],
    };
  }

  private buildConfirmationText(action: AgentAction): string {
    switch (action.tool) {
      case "transactions.create":
        return "I found a transaction to record. Confirm?";
      case "clients.create":
        return "I found a new client to create. Confirm?";
      case "invoices.create_draft":
        return "I found an invoice draft to create. Confirm?";
      case "invoices.send":
        return "I found an invoice send action. Confirm?";
      case "invoices.send_reminder":
        return "I found a payment reminder to send. Confirm?";
      case "reports.generate":
        return "I found a report to generate. Confirm?";
      default:
        return "Confirm this action?";
    }
  }

  private resolvePendingDecision(message: string, action: AgentAction | undefined): { approved: boolean; action: AgentAction } | null {
    if (!action) {
      return null;
    }

    const normalized = message.trim().toLowerCase();
    const compact = normalized.replace(/[.!؟?،,\s]/g, "");

    const yes = new Set([
      "yes",
      "y",
      "ok",
      "okay",
      "confirm",
      "confirmed",
      "approve",
      "approved",
      "doit",
      "sendit",
      "goahead",
      "نعم",
      "اي",
      "أيوه",
      "ايوه",
      "تمام",
      "اكد",
      "أكد",
      "ارسل",
      "أرسل",
      "ابعث",
    ]);

    const no = new Set([
      "no",
      "n",
      "cancel",
      "stop",
      "reject",
      "لا",
      "لأ",
      "الغاء",
      "إلغاء",
      "وقف",
      "اوقف",
    ]);

    if (yes.has(compact)) {
      return { approved: true, action };
    }

    if (no.has(compact)) {
      return { approved: false, action };
    }

    return null;
  }

  private remember(
    conversationId: string | undefined,
    input: AgentCommandInput,
    result: AgentRunResult,
    options: { pendingAction?: AgentAction; clearPendingAction?: boolean } = {},
  ) {
    agentConversationMemory.remember({
      conversationId,
      userMessage: input.message,
      assistantMessage: result.message,
      pendingAction: options.pendingAction,
      clearPendingAction: options.clearPendingAction,
    });
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  const braceStart = text.indexOf("{");
  const braceEnd = findBalancedJsonEnd(text, braceStart);
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  return text;
}

function findBalancedJsonEnd(text: string, start: number): number {
  if (start < 0) {
    return -1;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function parsePlannerJson(text: string): unknown {
  const json = extractJson(text);

  try {
    return JSON.parse(json);
  } catch {
    const repaired = json
      .replace(/:\s*\.(\d+)/g, ": 0.$1")
      .replace(/:\s*(-?\d+)\.(?=\s*[,}\]])/g, ": $1.0")
      .replace(/("[^"]*"|-?\d+(?:\.\d+)?|true|false|null|\]|\})\s*\n\s*(")/g, "$1,\n$2")
      .replace(/,\s*([}\]])/g, "$1");

    return JSON.parse(repaired);
  }
}

function normalizePlanPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const plan = payload as Record<string, unknown>;
  const normalized = { ...plan };

  if (typeof normalized.targetScreen === "string") {
    normalized.targetScreen = normalizePage(normalized.targetScreen);
  }

  if (normalized.action && typeof normalized.action === "object" && !Array.isArray(normalized.action)) {
    const action = normalized.action as Record<string, unknown>;
    const args = action.args && typeof action.args === "object" && !Array.isArray(action.args)
      ? { ...(action.args as Record<string, unknown>) }
      : {};

    if (typeof args.screen === "string") {
      args.screen = normalizePage(args.screen);
    }

    const tool = typeof action.tool === "string"
      ? normalizeTool(action.tool)
      : typeof action.name === "string"
        ? normalizeTool(action.name)
        : action.tool;

    normalized.action = {
      ...action,
      tool,
      args,
    };

    if (typeof tool === "string") {
      const targetScreen = tool === "ui.navigate" && typeof args.screen === "string"
        ? args.screen
        : targetScreenForTool(tool);

      if (targetScreen && (tool !== "ui.navigate" || typeof normalized.targetScreen !== "string" || normalized.targetScreen === "dashboard")) {
        normalized.targetScreen = targetScreen;
      }
    }
  }

  return normalized;
}

function normalizeTool(tool: string): string {
  const key = tool.trim().toLowerCase().replace(/[.\s-]+/g, "_");
  const aliases: Record<string, string> = {
    navigate: "ui.navigate",
    ui_go: "ui.navigate",
    ui_open: "ui.navigate",
    ui_navigate: "ui.navigate",
    open_screen: "ui.navigate",
    transaction_create: "transactions.create",
    transactions_create: "transactions.create",
    transactions_add: "transactions.create",
    expense_create: "transactions.create",
    expenses_create: "transactions.create",
    transaction_list: "transactions.list",
    transactions_list: "transactions.list",
    expense_list: "transactions.list",
    expenses_list: "transactions.list",
    client_create: "clients.create",
    clients_create: "clients.create",
    client_find: "clients.find",
    clients_find: "clients.find",
    client_search: "clients.find",
    clients_search: "clients.find",
    invoice_create: "invoices.create_draft",
    invoice_create_draft: "invoices.create_draft",
    invoices_create: "invoices.create_draft",
    invoices_create_draft: "invoices.create_draft",
    invoices_draft: "invoices.create_draft",
    invoice_draft: "invoices.create_draft",
    invoice_send: "invoices.send",
    invoices_send: "invoices.send",
    invoices_send_invoice: "invoices.send",
    invoice_send_invoice: "invoices.send",
    send_invoice: "invoices.send",
    invoice_reminder: "invoices.send_reminder",
    invoices_reminder: "invoices.send_reminder",
    invoice_remind: "invoices.send_reminder",
    invoices_remind: "invoices.send_reminder",
    remind_invoice: "invoices.send_reminder",
    send_reminder: "invoices.send_reminder",
    payment_reminder: "invoices.send_reminder",
    invoice_send_reminder: "invoices.send_reminder",
    invoices_send_reminder: "invoices.send_reminder",
    invoice_chaser: "invoices.send_reminder",
    invoices_chaser: "invoices.send_reminder",
    send_chaser: "invoices.send_reminder",
    zakat_calc: "zakat.calculate",
    zakat_calculate: "zakat.calculate",
    report_generate: "reports.generate",
    reports_generate: "reports.generate",
  };

  return aliases[key] ?? tool;
}

function normalizePage(page: string): string {
  const key = page.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, string> = {
    invoice: "invoices",
    client: "clients",
    expense: "expenses",
    transaction: "expenses",
    transactions: "expenses",
    contract: "contracts",
    report: "reports",
    home: "dashboard",
  };

  return aliases[key] ?? page;
}

function targetScreenForTool(tool: string): string | undefined {
  if (tool.startsWith("invoices.")) return "invoices";
  if (tool.startsWith("clients.")) return "clients";
  if (tool.startsWith("transactions.")) return "expenses";
  if (tool.startsWith("zakat.")) return "zakat";
  if (tool.startsWith("reports.")) return "reports";
  return undefined;
}
