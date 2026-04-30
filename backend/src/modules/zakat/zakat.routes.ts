import { Router } from "express";
import { ZakatController } from "./zakat.controller.js";
import { ZakatRepository } from "./zakat.repository.js";
import { ZakatService } from "./zakat.service.js";

const repository = new ZakatRepository();
const service = new ZakatService(repository);
const controller = new ZakatController(service);

export const zakatRouter = Router();

/**
 * @swagger
 * /api/zakat:
 *   get:
 *     summary: List zakat records
 *     tags:
 *       - Zakat
 */
zakatRouter.get("/", (request, response, next) => {
  controller.list(request, response).catch(next);
});

/**
 * @swagger
 * /api/zakat/calculate:
 *   post:
 *     summary: Calculate and store zakat record
 *     tags:
 *       - Zakat
 */
zakatRouter.post("/calculate", (request, response, next) => {
  controller.calculate(request, response).catch(next);
});

/**
 * @swagger
 * /api/zakat/{id}:
 *   get:
 *     summary: Get zakat record by id
 *     tags:
 *       - Zakat
 */
zakatRouter.get("/:id", (request, response, next) => {
  controller.getById(request, response).catch(next);
});

/**
 * @swagger
 * /api/zakat/{id}:
 *   patch:
 *     summary: Update zakat record
 *     tags:
 *       - Zakat
 */
zakatRouter.patch("/:id", (request, response, next) => {
  controller.update(request, response).catch(next);
});

/**
 * @swagger
 * /api/zakat/{id}:
 *   delete:
 *     summary: Delete zakat record
 *     tags:
 *       - Zakat
 */
zakatRouter.delete("/:id", (request, response, next) => {
  controller.delete(request, response).catch(next);
});