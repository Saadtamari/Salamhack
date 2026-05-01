import { Router } from "express";
import { audioUpload } from "../../shared/middlewares/audio-upload.middleware.js";
import { VoiceController } from "./voice.controller.js";
import { VoiceService } from "./voice.service.js";

const service = new VoiceService();
const controller = new VoiceController(service);

export const voiceRouter = Router();

/**
 * @swagger
 * /api/voice/transcribe:
 *   post:
 *     summary: Transcribe audio to text (Arabic STT)
 *     tags:
 *       - Voice
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: audio
 *         type: file
 *         required: true
 *       - in: formData
 *         name: language
 *         type: string
 *         default: ar
 */
voiceRouter.post("/transcribe", audioUpload.single("audio"), (request, response, next) => {
  controller.transcribe(request, response).catch(next);
});

/**
 * @swagger
 * /api/voice/process:
 *   post:
 *     summary: Full voice pipeline - transcribe, classify intent, respond, synthesize
 *     tags:
 *       - Voice
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: audio
 *         type: file
 *         required: true
 *       - in: formData
 *         name: context
 *         type: string
 *         description: JSON string with current screen context
 */
voiceRouter.post("/process", audioUpload.single("audio"), (request, response, next) => {
  controller.process(request, response).catch(next);
});

/**
 * @swagger
 * /api/voice/synthesize:
 *   post:
 *     summary: Convert text to speech (Arabic TTS)
 *     tags:
 *       - Voice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *               voice:
 *                 type: string
 */
voiceRouter.post("/synthesize", (request, response, next) => {
  controller.synthesize(request, response).catch(next);
});
