import { Router } from "express";
import { upload } from "../../shared/middlewares/upload.middleware.js";
import { AIController } from "./ai.controller.js";
import { AIService } from "./ai.service.js";

const service = new AIService();
const controller = new AIController(service);

export const aiRouter = Router();

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat with Masraf AI assistant
 *     tags:
 *       - AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *               context:
 *                 type: object
 *               history:
 *                 type: array
 */
aiRouter.post("/chat", (request, response, next) => {
  controller.chat(request, response).catch(next);
});

/**
 * @swagger
 * /api/ai/generate-chaser:
 *   post:
 *     summary: Generate payment chaser message
 *     tags:
 *       - AI
 */
aiRouter.post("/generate-chaser", (request, response, next) => {
  controller.generateChaser(request, response).catch(next);
});

/**
 * @swagger
 * /api/ai/analyze-contract:
 *   post:
 *     summary: AI-powered contract analysis
 *     tags:
 *       - AI
 */
aiRouter.post("/analyze-contract", (request, response, next) => {
  controller.analyzeContract(request, response).catch(next);
});

/**
 * @swagger
 * /api/ai/scan-receipt:
 *   post:
 *     summary: Scan a receipt image and extract structured fields via Groq vision
 *     tags:
 *       - AI
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 */
aiRouter.post("/scan-receipt", upload.single("image"), (request, response, next) => {
  controller.scanReceipt(request, response).catch(next);
});
