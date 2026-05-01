import { groqTranscribeAudio, groqTextToSpeech } from "../../infrastructure/ai/groq.js";
import { db } from "../../infrastructure/database/db.js";
import { voiceLogs, type NewVoiceLogRow } from "../../infrastructure/database/schema.js";
import type { AIChatResponse } from "../ai/ai.service.js";
import { AgentService } from "../agent/agent.service.js";
import type { AgentContext, AgentHistoryMessage, AgentRunResult } from "../agent/agent.schemas.js";

export interface TranscribeResult {
  text: string;
  language?: string;
  duration?: number;
}

export interface VoiceProcessResult {
  transcript: string;
  aiResponse: AIChatResponse;
  agentResponse: AgentRunResult;
  audioBase64?: string;
  audioContentType?: string;
  processingTimeMs: number;
}

export class VoiceService {
  private readonly agentService: AgentService;

  constructor() {
    this.agentService = new AgentService();
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
    context?: AgentContext,
    options: { executeAction?: boolean; history?: AgentHistoryMessage[] } = {},
  ): Promise<VoiceProcessResult> {
    const startTime = Date.now();

    const transcription = await this.transcribe(audioBuffer);

    if (!transcription.text || transcription.text.trim().length === 0) {
      const processingTimeMs = Date.now() - startTime;
      const agentResponse = this.emptyAgentResponse();

      return {
        transcript: "",
        aiResponse: this.toLegacyAIResponse(agentResponse),
        agentResponse,
        processingTimeMs,
      };
    }

    const agentResponse = await this.agentService.run({
      message: transcription.text,
      context,
      history: options.history,
      executeAction: options.executeAction,
    });
    const aiResponse = this.toLegacyAIResponse(agentResponse);

    let audioBase64: string | undefined;
    let audioContentType: string | undefined;
    try {
      const ttsResult = await this.synthesize(agentResponse.message);
      audioBase64 = ttsResult.audioBuffer.toString("base64");
      audioContentType = ttsResult.contentType;
    } catch (error) {
      console.warn("[voice] TTS failed, returning text-only:", error instanceof Error ? error.message : error);
    }

    const processingTimeMs = Date.now() - startTime;

    await this.logVoiceInteraction({
      transcript: transcription.text,
      intent: agentResponse.action?.tool ?? null,
      actionTaken: agentResponse.action ? JSON.stringify(agentResponse.action) : null,
      responseText: agentResponse.message,
      sourcePage: context?.screen ?? null,
      navigatedTo: agentResponse.actionResult?.targetScreen ?? agentResponse.plan.targetScreen ?? null,
      processingTimeMs,
      success: true,
    });

    return {
      transcript: transcription.text,
      aiResponse,
      agentResponse,
      audioBase64,
      audioContentType,
      processingTimeMs,
    };
  }

  private emptyAgentResponse(): AgentRunResult {
    return {
      status: "needs_clarification",
      message: "I could not understand the audio. Try again clearly.",
      plan: {
        response: "I could not understand the audio. Try again clearly.",
        confidence: 0,
        action: null,
        missingFields: ["audio"],
        requiresConfirmation: false,
        suggestions: ["Try again", "Type the request"],
      },
      action: null,
      suggestions: ["Try again", "Type the request"],
    };
  }

  private toLegacyAIResponse(result: AgentRunResult): AIChatResponse {
    return {
      message: result.message,
      messageEn: result.messageEn,
      action: result.action
        ? {
            type: result.action.tool,
            screen: result.actionResult?.targetScreen ?? result.plan.targetScreen,
            data: result.action.args,
          }
        : null,
      actionResult: result.actionResult
        ? {
            executed: result.actionResult.executed,
            type: result.actionResult.tool,
            data: result.actionResult.data,
            message: result.actionResult.message,
          }
        : undefined,
      suggestions: result.suggestions,
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
