import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import type { VoiceService } from "./voice.service.js";

const synthesizeBodySchema = z.object({
  text: z.string().trim().min(1, "text is required"),
  voice: z.string().trim().optional(),
});

const voiceContextSchema = z.object({
  screen: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export class VoiceController {
  constructor(private readonly service: VoiceService) {}

  async transcribe(request: Request, response: Response): Promise<void> {
    const file = request.file;

    if (!file) {
      throw new AppError("Audio file is required", 400);
    }

    const language = typeof request.body?.language === "string" ? request.body.language : undefined;

    const result = await this.service.transcribe(file.buffer, {
      filename: file.originalname,
      language,
    });

    response.json({
      success: true,
      data: result,
    });
  }

  async process(request: Request, response: Response): Promise<void> {
    const file = request.file;

    if (!file) {
      throw new AppError("Audio file is required", 400);
    }

    let context: z.infer<typeof voiceContextSchema> | undefined;
    const rawContext = request.body?.context;
    const executeAction = request.body?.executeAction === "true" || request.body?.execute_action === "true";

    if (typeof rawContext === "string" && rawContext.trim().length > 0) {
      try {
        context = voiceContextSchema.parse(JSON.parse(rawContext));
      } catch {
        // ignore invalid JSON in context
      }
    } else if (rawContext && typeof rawContext === "object") {
      context = voiceContextSchema.parse(rawContext);
    }

    const result = await this.service.process(file.buffer, context, { executeAction });

    response.json({
      success: true,
      data: result,
    });
  }

  async synthesize(request: Request, response: Response): Promise<void> {
    const body = synthesizeBodySchema.parse(request.body);
    const result = await this.service.synthesize(body.text, body.voice);

    response.set("Content-Type", result.contentType);
    response.set("Content-Length", String(result.audioBuffer.length));
    response.send(result.audioBuffer);
  }
}
