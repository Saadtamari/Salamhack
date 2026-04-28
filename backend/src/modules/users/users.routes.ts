import { Router } from "express";
import { UsersController } from "./users.controller.js";
import { UsersRepository } from "./users.repository.js";
import { UsersService } from "./users.service.js";

const usersRepository = new UsersRepository();
const usersService = new UsersService(usersRepository);
const usersController = new UsersController(usersService);

export const usersRouter = Router();

usersRouter.get("/", (request, response, next) => {
  usersController.list(request, response).catch(next);
});

usersRouter.get("/:id", (request, response, next) => {
  usersController.getById(request, response).catch(next);
});

usersRouter.post("/", (request, response, next) => {
  usersController.create(request, response).catch(next);
});
