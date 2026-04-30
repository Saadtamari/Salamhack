import { Router } from "express";
import { InvoicesController } from "./invoices.controller.js";
import { InvoicesRepository } from "./invoices.repository.js";
import { InvoicesService } from "./invoices.service.js";

const repository = new InvoicesRepository();
const service = new InvoicesService(repository);
const controller = new InvoicesController(service);

export const invoicesRouter = Router();

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: List invoices
 *     tags:
 *       - Invoices
 */
invoicesRouter.get("/", (request, response, next) => {
  controller.list(request, response).catch(next);
});

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create invoice
 *     tags:
 *       - Invoices
 */
invoicesRouter.post("/", (request, response, next) => {
  controller.create(request, response).catch(next);
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by id
 *     tags:
 *       - Invoices
 */
invoicesRouter.get("/:id", (request, response, next) => {
  controller.getById(request, response).catch(next);
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   patch:
 *     summary: Update invoice
 *     tags:
 *       - Invoices
 */
invoicesRouter.patch("/:id", (request, response, next) => {
  controller.update(request, response).catch(next);
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   delete:
 *     summary: Cancel invoice
 *     tags:
 *       - Invoices
 */
invoicesRouter.delete("/:id", (request, response, next) => {
  controller.cancel(request, response).catch(next);
});

/**
 * @swagger
 * /api/invoices/pdf:
 *   post:
 *     summary: Generate and store invoice PDF
 *     tags:
 *       - Invoices
 */
invoicesRouter.post("/pdf", (request, response, next) => {
  controller.generatePdf(request, response).catch(next);
});
