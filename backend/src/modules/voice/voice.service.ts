import { groqTranscribeAudio, groqTextToSpeech } from "../../infrastructure/ai/groq.js";
import { db } from "../../infrastructure/database/db.js";
import { voiceLogs, type NewVoiceLogRow } from "../../infrastructure/database/schema.js";
import { AIService, type AIChatResponse } from "../ai/ai.service.js";

export interface TranscribeResult {
  text: string;
  language?: string;
  duration?: number;
}

export interface VoiceProcessResult {
  transcript: string;
  response: AIChatResponse;
  audio?: {
    contentType: string;
    base64: string;
  } | null;
  processingTimeMs: number;
}

export class VoiceService {
  private readonly aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async transcribe(
    audioBuffer: Buffer,
    options: { filename?: string; language?: string } = {},
  ): Promise<TranscribeResult> {
    const result = await groqTranscribeAudio(audioBuffer, {
      filename: options.filename,
      language: options.language ?? "ar",
    });

    return {
      text: result.text,
      language: result.language,
      duration: result.duration,
    };
  }

  async synthesize(text: string, voice?: string) {
    const result = await groqTextToSpeech(text, { voice });
    return {
      audioBuffer: result.audioBuffer,
      contentType: result.contentType,
    };
  }

  async process(
    audioBuffer: Buffer,
    context?: { screen?: string; data?: Record<string, unknown> },
    options: { executeAction?: boolean } = {},
  ): Promise<VoiceProcessResult> {
    const startTime = Date.now();

    // Step 1: Transcribe audio to text
    const transcription = await this.transcribe(audioBuffer);

    if (!transcription.text || transcription.text.trim().length === 0) {
      const processingTimeMs = Date.now() - startTime;
      return {
        transcript: "",
        response: {
          message: "لم أتمكن من فهم الصوت. حاول مرة أخرى بوضوح.",
          action: null,
          suggestions: ["حاول مرة أخرى", "اكتب طلبك"],
        },
        audio: null,
        processingTimeMs,
      };
    }

    // Step 2: Send transcript to AI for intent classification + response
    const aiResponse = await this.aiService.chat({
      message: transcription.text,
      context,
      executeAction: options.executeAction,
    });

    // Step 3: Try TTS on the response (best-effort)
    let audio: VoiceProcessResult["audio"] = null;
    try {
      const ttsResult = await this.synthesize(aiResponse.message);
      audio = {
        base64: ttsResult.audioBuffer.toString("base64"),
        contentType: ttsResult.contentType,
      };
    } catch (error) {
      console.warn("[voice] TTS failed, returning text-only:", error instanceof Error ? error.message : error);
    }

    const processingTimeMs = Date.now() - startTime;

    // Step 4: Log the voice interaction
    await this.logVoiceInteraction({
      transcript: transcription.text,
      intent: aiResponse.action?.type ?? null,
      actionTaken: aiResponse.action ? JSON.stringify(aiResponse.action) : null,
      responseText: aiResponse.message,
      sourcePage: context?.screen ?? null,
      navigatedTo: aiResponse.action?.type === "navigate" ? (aiResponse.action.screen ?? null) : null,
      processingTimeMs,
      success: true,
    });

    return {
      transcript: transcription.text,
      response: aiResponse,
      audio,
      processingTimeMs,
    };
  }

  private async logVoiceInteraction(log: {
    transcript: string | null;
    intent: string | null;
    actionTaken: string | null;
    responseText: string | null;
    sourcePage: string | null;
    navigatedTo: string | null;
    processingTimeMs: number;
    success: boolean;
  }) {
    try {
      const row: NewVoiceLogRow = {
        transcript: log.transcript,
        intent: log.intent,
        actionTaken: log.actionTaken,
        responseText: log.responseText,
        sourcePage: log.sourcePage,
        navigatedTo: log.navigatedTo,
        processingTimeMs: log.processingTimeMs,
        success: log.success,
      };
      await db.insert(voiceLogs).values(row);
    } catch (error) {
      console.error("[voice] Failed to log voice interaction:", error instanceof Error ? error.message : error);
    }
  }
}
