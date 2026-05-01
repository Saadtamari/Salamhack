import { Router } from "express";
import { ReportsController } from "./reports.controller.js";
import { ReportsRepository } from "./reports.repository.js";
import { ReportsService } from "./reports.service.js";

const repository = new ReportsRepository();
const service = new ReportsService(repository);
const controller = new ReportsController(service);

export const reportsRouter = Router();

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: List financial reports
 *     tags:
 *       - Reports
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 */
reportsRouter.get("/", (request, response, next) => {
  controller.list(request, response).catch(next);
});

/**
 * @swagger
 * /api/reports/generate:
 *   post:
 *     summary: Generate monthly financial report with AI summary
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [month, year]
 *             properties:
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 */
reportsRouter.post("/generate", (request, response, next) => {
  controller.generate(request, response).catch(next);
});

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get report by id
 *     tags:
 *       - Reports
 */
reportsRouter.get("/:id", (request, response, next) => {
  controller.getById(request, response).catch(next);
});
