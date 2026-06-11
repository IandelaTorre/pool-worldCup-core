import bcrypt from "bcryptjs";
import { UserRepository } from "../../../domain/interfaces/UserRepository.js";
import { JWTService } from "../../../infrastructure/auth/JWTService.js";
import { UnauthorizedError } from "../../../domain/errors/domainErrors.js";
import { UserWithoutPassword } from "../../../domain/entities/User.js";

export interface LoginUserDTO {
  identifier: string;
  password: string;
}

export class LoginUser {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JWTService
  ) {}

  async execute(data: LoginUserDTO): Promise<{ user: UserWithoutPassword; token: string }> {
    let user = await this.userRepository.findByEmail(data.identifier);
    if (!user) {
      user = await this.userRepository.findByUsername(data.identifier);
    }

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedError("Invalid credentials");
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
