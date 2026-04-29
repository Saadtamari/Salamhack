import { Router } from "express";
import { TransactionsController } from "./transactions.controller.js";
import { TransactionsRepository } from "./transactions.repository.js";
import { TransactionsService } from "./transactions.service.js";

const repository = new TransactionsRepository();
const service = new TransactionsService(repository);
const controller = new TransactionsController(service);

export const transactionsRouter = Router();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: List transactions
 *     tags:
 *       - Transactions
 */
transactionsRouter.get("/", (request, response, next) => {
  controller.list(request, response).catch(next);
});

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create transaction
 *     tags:
 *       - Transactions
 */
transactionsRouter.post("/", (request, response, next) => {
  controller.create(request, response).catch(next);
});
