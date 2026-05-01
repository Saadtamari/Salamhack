import { Router } from "express";
import { AgentController } from "./agent.controller.js";
import { AgentService } from "./agent.service.js";

const service = new AgentService();
const controller = new AgentController(service);

export const agentRouter = Router();

/**
 * @swagger
 * /api/agent/command:
 *   post:
 *     summary: Plan, confirm, and execute a typed Masraf agent command
 *     tags:
 *       - Agent
 */
agentRouter.post("/command", (request, response, next) => {
  controller.command(request, response).catch(next);
});
