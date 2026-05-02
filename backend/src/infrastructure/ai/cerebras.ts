import Cerebras, { APIError, RateLimitError } from "@cerebras/cerebras_cloud_sdk";
import { env } from "../../config/env.js";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

let _cerebrasClient: Cerebras | null = null;

function getCerebrasClient(): Cerebras {
  if (!_cerebrasClient) {
    _cerebrasClient = new Cerebras({ apiKey: env.CEREBRAS_API_KEY });
  }
  return _cerebrasClient;
}

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

type CandidateSpec =
  | { provider: "cerebras"; model: string }
  | { provider: "groq"; apiKey: string; model: string };

export async function cerebrasChatCompletion(
  messages: ChatMessage[],
  options: {
    model?: string;
    fallbackModel?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    maxRetries?: number;
    timeoutMs?: number;
  } = {},
): Promise<CerebrasResponse> {
  const maxRetries = options.maxRetries ?? 2;
  const modelCandidates = uniqueCandidates([
    { provider: "cerebras", model: options.model ?? env.CEREBRAS_MODEL },
    { provider: "cerebras", model: options.fallbackModel ?? env.CEREBRAS_FALLBACK_MODEL },
    { provider: "groq", apiKey: env.GROQ_API_KEY, model: "llama-3.1-8b-instant" },
    { provider: "groq", apiKey: env.GROQ_API_KEY, model: env.GROQ_CHAT_MODEL },
  ]);
  let lastError: unknown;

  for (const candidate of modelCandidates) {
    try {
      if (candidate.provider === "cerebras") {
        return await requestWithCerebras(candidate.model, messages, options, maxRetries);
      } else {
        return await requestWithGroq(candidate.model, candidate.apiKey, messages, options, maxRetries);
      }
    } catch (error) {
      lastError = error;
      console.warn(
        `[ai] ${candidate.provider} model ${candidate.model} failed:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("AI API error: all configured models failed.");
}

async function requestWithCerebras(
  model: string,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; topP?: number },
  maxRetries: number,
): Promise<CerebrasResponse> {
  const client = getCerebrasClient();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await client.chat.completions.create({
        model,
        messages: messages as any[],
        temperature: options.temperature ?? 0.7,
        max_completion_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 1,
      });
      return response as unknown as CerebrasResponse;
    } catch (error: unknown) {
      const isRetryable = error instanceof RateLimitError
        || (error instanceof APIError && [500, 502, 503, 504].includes(error.status ?? 0));

      if (isRetryable && attempt < maxRetries) {
        await delay(Math.min(500 * 2 ** attempt, 3_000));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Cerebras API error for ${model}: retry loop exited unexpectedly.`);
}

async function requestWithGroq(
  model: string,
  apiKey: string,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; topP?: number; timeoutMs?: number },
  maxRetries: number,
): Promise<CerebrasResponse> {
  const requestBody = JSON.stringify({
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_completion_tokens: options.maxTokens ?? 2048,
    top_p: options.topP ?? 1,
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: requestBody,
    });

    if (response.ok) {
      return response.json() as Promise<CerebrasResponse>;
    }

    const errorBody = await response.text().catch(() => "unknown error");
    const canRetry = RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries;

    if (!canRetry) {
      throw new Error(`groq API error for ${model} (${response.status}): ${errorBody}`);
    }

    await delay(getRetryDelayMs(response, attempt));
  }

  throw new Error(`groq API error for ${model}: retry loop exited unexpectedly.`);
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

function uniqueCandidates(candidates: CandidateSpec[]): CandidateSpec[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const model = c.model.trim();
    const key = `${c.provider}:${model}`;
    if (!model || seen.has(key)) return false;
    seen.add(key);
    c.model = model;
    return true;
  });
}
