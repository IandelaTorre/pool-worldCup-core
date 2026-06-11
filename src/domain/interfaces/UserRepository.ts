import { User, UserWithoutPassword, CatalogUserRole, UserRole } from "../entities/User.js";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  addRole(userId: string, roleId: string): Promise<UserRole>;
  getRoles(userId: string): Promise<CatalogUserRole[]>;
  getGroupIds(userId: string): Promise<string[]>;
}
