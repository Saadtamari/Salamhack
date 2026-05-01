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
      voice: options.voice ?? "Nasser-PlayAI",
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
