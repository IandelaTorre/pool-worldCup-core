import { eq } from "drizzle-orm";
import { db } from "../database/connection.js";
import { catalogUserRoles } from "../database/schema/index.js";
import { RoleRepository } from "../../domain/interfaces/RoleRepository.js";
import { CatalogUserRole } from "../../domain/entities/User.js";

export class DrizzleRoleRepository implements RoleRepository {
  async findByName(name: string): Promise<CatalogUserRole | null> {
    const result = await db.query.catalogUserRoles.findFirst({
      where: eq(catalogUserRoles.name, name),
    });
    return result || null;
  }

  async findById(id: string): Promise<CatalogUserRole | null> {
    const result = await db.query.catalogUserRoles.findFirst({
      where: eq(catalogUserRoles.id, id),
    });
    return result || null;
  }

  async findAll(): Promise<CatalogUserRole[]> {
    const result = await db.query.catalogUserRoles.findMany();
    return result;
  }

  async create(
    roleData: Omit<CatalogUserRole, "id" | "createdAt">
  ): Promise<CatalogUserRole> {
    const result = await db
      .insert(catalogUserRoles)
      .values({
        name: roleData.name,
        description: roleData.description,
      })
      .returning();
    return result[0];
  }
}
