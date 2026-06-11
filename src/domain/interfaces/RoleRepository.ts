import { CatalogUserRole } from "../entities/User.js";

export interface RoleRepository {
  findByName(name: string): Promise<CatalogUserRole | null>;
  findById(id: string): Promise<CatalogUserRole | null>;
  findAll(): Promise<CatalogUserRole[]>;
  create(role: Omit<CatalogUserRole, "id" | "createdAt">): Promise<CatalogUserRole>;
}
