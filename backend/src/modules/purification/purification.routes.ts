import { Router } from "express";
import { PurificationController } from "./purification.controller.js";
import { PurificationRepository } from "./purification.repository.js";
import { PurificationService } from "./purification.service.js";

const repository = new PurificationRepository();
const service = new PurificationService(repository);
const controller = new PurificationController(service);

export const purificationRouter = Router();

/**
 * @swagger
 * /api/purification:
 *   get:
 *     summary: List purification records
 *     tags:
 *       - Purification
 *     parameters:
 *       - in: query
 *         name: purified
 *         schema:
 *           type: boolean
 */
purificationRouter.get("/", (request, response, next) => {
  controller.list(request, response).catch(next);
});

/**
 * @swagger
 * /api/purification:
 *   post:
 *     summary: Create purification record
 *     tags:
 *       - Purification
 */
purificationRouter.post("/", (request, response, next) => {
  controller.create(request, response).catch(next);
});

/**
 * @swagger
 * /api/purification/{id}:
 *   get:
 *     summary: Get purification record by id
 *     tags:
 *       - Purification
 */
purificationRouter.get("/:id", (request, response, next) => {
  controller.getById(request, response).catch(next);
});

/**
 * @swagger
 * /api/purification/{id}/purify:
 *   post:
 *     summary: Mark a purification record as purified
 *     tags:
 *       - Purification
 */
purificationRouter.post("/:id/purify", (request, response, next) => {
  controller.markPurified(request, response).catch(next);
});

/**
 * @swagger
 * /api/purification/{id}:
 *   delete:
 *     summary: Delete purification record
 *     tags:
 *       - Purification
 */
purificationRouter.delete("/:id", (request, response, next) => {
  controller.delete(request, response).catch(next);
});
