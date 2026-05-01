import { Router } from "express";
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
