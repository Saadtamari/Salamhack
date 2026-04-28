import { Router } from "express";
import { HealthController } from "./health.controller.js";

const healthController = new HealthController();

export const healthRouter = Router();

healthRouter.get("/", (request, response) => healthController.check(request, response));
