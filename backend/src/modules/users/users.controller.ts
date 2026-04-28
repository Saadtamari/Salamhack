import type { Request, Response } from "express";
import { createUserSchema } from "./users.validators.js";
import { UsersService } from "./users.service.js";

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async create(request: Request, response: Response): Promise<void> {
    const payload = createUserSchema.parse(request.body);
    const user = await this.usersService.createUser(payload);

    response.status(201).json({
      success: true,
      data: user,
    });
  }

  async list(_request: Request, response: Response): Promise<void> {
    const users = await this.usersService.listUsers();

    response.status(200).json({
      success: true,
      data: users,
    });
  }

  async getById(request: Request, response: Response): Promise<void> {
    const rawId = request.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const user = await this.usersService.getUserById(id ?? "");

    response.status(200).json({
      success: true,
      data: user,
    });
  }
}
