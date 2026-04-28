import { AppError } from "../../shared/errors/app-error.js";
import type { CreateUserInput } from "./users.types.js";
import { UsersRepository } from "./users.repository.js";

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(input: CreateUserInput) {
    return this.usersRepository.create(input);
  }

  async listUsers() {
    return this.usersRepository.findAll();
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}
