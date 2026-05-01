import { env } from "../../config/env.js";

const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CerebrasResponse {
  id: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function cerebrasChatCompletion(
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    maxRetries?: number;
    timeoutMs?: number;
  } = {},
): Promise<CerebrasResponse> {
  const maxRetries = options.maxRetries ?? 2;
  const requestBody = JSON.stringify({
    model: env.CEREBRAS_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_completion_tokens: options.maxTokens ?? 2048,
    top_p: options.topP ?? 1,
  });

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.CEREBRAS_API_KEY}`,
      },
      body: requestBody,
    });

    if (response.ok) {
      return response.json() as Promise<CerebrasResponse>;
    }

    const errorBody = await response.text().catch(() => "unknown error");
    const canRetry = RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries;

    if (!canRetry) {
      throw new Error(`Cerebras API error (${response.status}): ${errorBody}`);
    }

    await delay(getRetryDelayMs(response, attempt));
  }

  throw new Error("Cerebras API error: retry loop exited unexpectedly");
}

function getRetryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : NaN;

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, 10_000);
  }

  return Math.min(500 * 2 ** attempt, 3_000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
