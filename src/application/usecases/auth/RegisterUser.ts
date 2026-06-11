import bcrypt from "bcryptjs";
import { UserRepository } from "../../../domain/interfaces/UserRepository.js";
import { RoleRepository } from "../../../domain/interfaces/RoleRepository.js";
import { JWTService } from "../../../infrastructure/auth/JWTService.js";
import {
  ConflictError,
  ValidationError,
  NotFoundError,
} from "../../../domain/errors/domainErrors.js";
import { UserWithoutPassword } from "../../../domain/entities/User.js";

export interface RegisterUserDTO {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export class RegisterUser {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private jwtService: JWTService
  ) {}

  async execute(data: RegisterUserDTO): Promise<{ user: UserWithoutPassword; token: string }> {
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError("Email already registered");
    }

    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictError("Username already taken");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.userRepository.create({
      username: data.username,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      avatarUrl: null,
    });

    const playerRole = await this.roleRepository.findByName("player");
    if (playerRole) {
      await this.userRepository.addRole(user.id, playerRole.id);
    }

    const roles = await this.userRepository.getRoles(user.id);
    const groupIds = await this.userRepository.getGroupIds(user.id);

    const token = this.jwtService.generateToken({
      sub: user.id,
      email: user.email,
      roles: roles.map((r) => r.name),
      groups: groupIds,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }
}
