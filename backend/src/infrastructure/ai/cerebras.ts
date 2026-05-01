import { env } from "../../config/env.js";

const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1";

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
  } = {},
): Promise<CerebrasResponse> {
  const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.CEREBRAS_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_completion_tokens: options.maxTokens ?? 2048,
      top_p: options.topP ?? 1,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new Error(`Cerebras API error (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<CerebrasResponse>;
}
