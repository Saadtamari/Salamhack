import { env } from "../../config/env.js";

const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

type ChatProvider = "groq" | "cerebras";

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
    {
      provider: "groq",
      baseUrl: GROQ_BASE_URL,
      apiKey: env.GROQ_API_KEY,
      model: options.model ?? env.GROQ_CHAT_MODEL,
    },
    {
      provider: "cerebras",
      baseUrl: CEREBRAS_BASE_URL,
      apiKey: env.CEREBRAS_API_KEY,
      model: options.fallbackModel ?? env.CEREBRAS_FALLBACK_MODEL,
    },
  ]);
  let lastError: unknown;

  for (const candidate of modelCandidates) {
    try {
      return await requestWithModel(candidate, messages, options, maxRetries);
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
    : new Error("Cerebras API error: all configured models failed.");
}

async function requestWithModel(
  candidate: {
    provider: ChatProvider;
    baseUrl: string;
    apiKey: string;
    model: string;
  },
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    timeoutMs?: number;
  },
  maxRetries: number,
): Promise<CerebrasResponse> {
  const requestBody = JSON.stringify({
    model: candidate.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_completion_tokens: options.maxTokens ?? 2048,
    top_p: options.topP ?? 1,
  });

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(`${candidate.baseUrl}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${candidate.apiKey}`,
      },
      body: requestBody,
    });

    if (response.ok) {
      return response.json() as Promise<CerebrasResponse>;
    }

    const errorBody = await response.text().catch(() => "unknown error");
    const canRetry = RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries;

    if (!canRetry) {
      throw new Error(`${candidate.provider} API error for ${candidate.model} (${response.status}): ${errorBody}`);
    }

    await delay(getRetryDelayMs(response, attempt));
  }

  throw new Error(`${candidate.provider} API error for ${candidate.model}: retry loop exited unexpectedly.`);
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

function uniqueCandidates(
  candidates: Array<{
    provider: ChatProvider;
    baseUrl: string;
    apiKey: string;
    model: string;
  }>,
) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const model = candidate.model.trim();
    const key = `${candidate.provider}:${model}`;
    if (!model || seen.has(key)) {
      return false;
    }

    seen.add(key);
    candidate.model = model;
    return true;
  });
}
