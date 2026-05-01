import { Router } from "express";
import { upload } from "../../shared/middlewares/upload.middleware.js";
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

/**
 * @swagger
 * /api/transactions/scan-receipt:
 *   post:
 *     summary: Scan a receipt image and extract expense data
 *     tags:
 *       - Transactions
 */
transactionsRouter.post(
  "/scan-receipt",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "receipt", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  (request, response, next) => {
    controller.scanReceipt(request, response).catch(next);
  },
);
