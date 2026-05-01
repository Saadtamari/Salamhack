import { env } from "../../config/env.js";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export interface GroqTranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export async function groqTranscribeAudio(
  audioBuffer: Buffer,
  options: {
    filename?: string;
    language?: string;
    model?: string;
  } = {},
): Promise<GroqTranscriptionResult> {
  const formData = new FormData();

  const arrayBuf = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuf], { type: "audio/wav" });
  formData.append("file", blob, options.filename ?? "audio.wav");
  formData.append("model", options.model ?? "whisper-large-v3");
  formData.append("response_format", "verbose_json");

  if (options.language) {
    formData.append("language", options.language);
  }

  const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new Error(`Groq STT API error (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<GroqTranscriptionResult>;
}

export interface GroqTTSResult {
  audioBuffer: Buffer;
  contentType: string;
}

export interface GroqReceiptExtraction {
  merchantName: string | null;
  amount: number | null;
  currency: string | null;
  transactionDate: string | null;
  category:
    | "food_dining"
    | "transport"
    | "software_tools"
    | "office_supplies"
    | "communication"
    | "marketing"
    | "education"
    | "health"
    | "rent"
    | "utilities"
    | "entertainment"
    | "other"
    | null;
  description: string;
  descriptionAr: string;
  isHalal: boolean;
  needsPurification: boolean;
  confidence: number;
  rawText: string;
  notes: string[];
}

export async function groqTextToSpeech(
  text: string,
  options: {
    model?: string;
    voice?: string;
    responseFormat?: string;
  } = {},
): Promise<GroqTTSResult> {
  const response = await fetch(`${GROQ_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model ?? "playai-tts-arabic",
      input: text,
      voice: options.voice ?? "Ahmad-PlayAI",
      response_format: options.responseFormat ?? "wav",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new Error(`Groq TTS API error (${response.status}): ${errorBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    audioBuffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get("content-type") ?? "audio/wav",
  };
}

export interface GroqVisionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export async function groqVisionAnalyze(
  imageBuffer: Buffer,
  mimeType: string,
  prompt: string,
  options: GroqVisionOptions = {},
): Promise<string> {
  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const body: Record<string, unknown> = {
    model: options.model ?? "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    temperature: options.temperature ?? 0.2,
    max_completion_tokens: options.maxTokens ?? 1024,
  };

  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new Error(`Groq vision API error (${response.status}): ${errorBody}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return json.choices?.[0]?.message?.content ?? "";
}

export async function groqAnalyzeReceiptImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<GroqReceiptExtraction> {
  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.GROQ_VISION_MODEL,
      response_format: { type: "json_object" },
      temperature: 0,
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You extract expense receipt data for an Arabic/English freelancer finance app. Return only valid JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Read this receipt/invoice image. Extract JSON with keys: merchantName, amount, currency, transactionDate (YYYY-MM-DD or null), category (food_dining, transport, software_tools, office_supplies, communication, marketing, education, health, rent, utilities, entertainment, other), description, descriptionAr, isHalal, needsPurification, confidence (0..1), rawText, notes array. Use null for unknown. Do not invent totals.",
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new Error(`Groq Vision API error (${response.status}): ${errorBody}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "{}";

  return normalizeReceiptExtraction(JSON.parse(extractJson(content)));
}

function normalizeReceiptExtraction(input: Partial<GroqReceiptExtraction>): GroqReceiptExtraction {
  const categoryValues = new Set([
    "food_dining",
    "transport",
    "software_tools",
    "office_supplies",
    "communication",
    "marketing",
    "education",
    "health",
    "rent",
    "utilities",
    "entertainment",
    "other",
  ]);
  const category = typeof input.category === "string" && categoryValues.has(input.category)
    ? input.category
    : "other";

  return {
    merchantName: input.merchantName ?? null,
    amount: typeof input.amount === "number" && Number.isFinite(input.amount) ? input.amount : null,
    currency: input.currency ?? null,
    transactionDate: input.transactionDate ?? null,
    category: category as GroqReceiptExtraction["category"],
    description: input.description ?? "Receipt expense",
    descriptionAr: input.descriptionAr ?? "مصروف من إيصال",
    isHalal: input.isHalal ?? true,
    needsPurification: input.needsPurification ?? false,
    confidence: clampConfidence(input.confidence),
    rawText: input.rawText ?? "",
    notes: Array.isArray(input.notes) ? input.notes.map(String) : [],
  };
}

function clampConfidence(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 0;
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  return text;
}
