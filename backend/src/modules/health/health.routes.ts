import { Router } from "express";
import { HealthController } from "./health.controller.js";

const healthController = new HealthController();

export const healthRouter = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running and healthy
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *               example:
 *                 success: true
 *                 message: "OK"
 */
healthRouter.get("/", (request, response) => healthController.check(request, response));
