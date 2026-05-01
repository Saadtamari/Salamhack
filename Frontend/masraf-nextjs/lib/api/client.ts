import type { ApiEnvelope, ApiQuery } from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:4000";
const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const apiConfig = {
  baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, ""),
  useBackend: process.env.NEXT_PUBLIC_USE_BACKEND === "true",
  strictBackend: process.env.NEXT_PUBLIC_STRICT_BACKEND === "true",
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: ApiQuery;
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
  headers?: HeadersInit;
};

type BinaryRequestOptions = Omit<RequestOptions, "body" | "formData"> & {
  body?: unknown;
};

function buildUrl(path: string, query?: ApiQuery) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${apiConfig.baseUrl}${normalizedPath}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function withTimeout<T>(task: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), apiConfig.timeoutMs);

  const abortFromParent = () => controller.abort();
  signal?.addEventListener("abort", abortFromParent, { once: true });

  try {
    return await task(controller.signal);
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromParent);
  }
}

function unwrapEnvelope<T>(payload: unknown, status: number): T {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ApiEnvelope<T>;

    if (!envelope.success) {
      throw new ApiError(envelope.message || envelope.error || "Backend request failed", status, envelope.details);
    }

    return envelope.data;
  }

  return payload as T;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload
      ? String((payload as { message?: unknown }).message)
      : `Backend request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return unwrapEnvelope<T>(payload, response.status);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, formData, headers, signal } = options;
  const hasJsonBody = body !== undefined && !formData;

  return withTimeout(async (timeoutSignal) => {
    const response = await fetch(buildUrl(path, query), {
      method,
      signal: timeoutSignal,
      headers: {
        ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: formData ?? (hasJsonBody ? JSON.stringify(body) : undefined),
    });

    return parseJsonResponse<T>(response);
  }, signal);
}

export async function apiBinary(path: string, options: BinaryRequestOptions = {}): Promise<Blob> {
  const { method = "POST", query, body, headers, signal } = options;

  return withTimeout(async (timeoutSignal) => {
    const response = await fetch(buildUrl(path, query), {
      method,
      signal: timeoutSignal,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      let details: unknown;
      try {
        details = await response.json();
      } catch {
        details = await response.text();
      }
      throw new ApiError(`Backend request failed (${response.status})`, response.status, details);
    }

    return response.blob();
  }, signal);
}

export function toFormData(values: Record<string, unknown>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof Blob) {
      formData.append(key, value);
      return;
    }
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, String(value));
  });

  return formData;
}
