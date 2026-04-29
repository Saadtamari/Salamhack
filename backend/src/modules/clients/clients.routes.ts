import { Router } from "express";
import { ClientsController } from "./clients.controller.js";
import { ClientsRepository } from "./clients.repository.js";
import { ClientsService } from "./clients.service.js";

const repository = new ClientsRepository();
const service = new ClientsService(repository);
const controller = new ClientsController(service);

export const clientsRouter = Router();

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: List clients
 *     tags:
 *       - Clients
 */
clientsRouter.get("/", (request, response, next) => {
  controller.list(request, response).catch(next);
});

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create client
 *     tags:
 *       - Clients
 */
clientsRouter.post("/", (request, response, next) => {
  controller.create(request, response).catch(next);
});

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by id
 *     tags:
 *       - Clients
 */
clientsRouter.get("/:id", (request, response, next) => {
  controller.getById(request, response).catch(next);
});

/**
 * @swagger
 * /api/clients/{id}:
 *   patch:
 *     summary: Update client
 *     tags:
 *       - Clients
 */
clientsRouter.patch("/:id", (request, response, next) => {
  controller.update(request, response).catch(next);
});
