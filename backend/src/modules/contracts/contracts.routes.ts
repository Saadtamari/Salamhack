import { Router } from "express";
import { upload } from "../../shared/middlewares/upload.middleware.js";
import { ContractsController } from "./contracts.controller.js";
import { ContractsRepository } from "./contracts.repository.js";
import { ContractsService } from "./contracts.service.js";

const repository = new ContractsRepository();
const service = new ContractsService(repository);
const controller = new ContractsController(service);

export const contractsRouter = Router();

/**
 * @swagger
 * /api/contracts:
 *   get:
 *     summary: List contracts
 *     tags:
 *       - Contracts
 */
contractsRouter.get("/", (request, response, next) => {
  controller.list(request, response).catch(next);
});

/**
 * @swagger
 * /api/contracts:
 *   post:
 *     summary: Upload and analyze contract
 *     tags:
 *       - Contracts
 */
contractsRouter.post(
  "/",
  (request, response, next) => {
    console.log("[contracts] POST /api/contracts entered", {
      contentType: request.headers["content-type"],
      bodyKeys: Object.keys(request.body ?? {}),
    });

    upload.single("file")(request, response, (error) => {
      if (error) {
        console.error("[contracts] multer upload failed", error);
        next(error);
        return;
      }

      console.log("[contracts] multer upload completed", {
      hasFile: Boolean(request.file),
      fileName: request.file?.originalname,
      mimeType: request.file?.mimetype,
      size: request.file?.size,
    });

      controller.create(request, response).catch(next);
    });
  },
);

/**
 * @swagger
 * /api/contracts/{id}:
 *   get:
 *     summary: Get contract by id
 *     tags:
 *       - Contracts
 */
contractsRouter.get("/:id", (request, response, next) => {
  controller.getById(request, response).catch(next);
});

/**
 * @swagger
 * /api/contracts/{id}:
 *   delete:
 *     summary: Delete contract
 *     tags:
 *       - Contracts
 */
contractsRouter.delete("/:id", (request, response, next) => {
  controller.delete(request, response).catch(next);
});
