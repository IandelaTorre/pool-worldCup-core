import { eq, and } from "drizzle-orm";
import { db } from "../database/connection.js";
import {
  users,
  userRoles,
  catalogUserRoles,
  groupMembers,
} from "../database/schema/index.js";
import { UserRepository } from "../../domain/interfaces/UserRepository.js";
import { User, UserWithoutPassword, CatalogUserRole, UserRole } from "../../domain/entities/User.js";

export class DrizzleUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return result || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return result || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.username, username),
    });
    return result || null;
  }

  async create(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    const result = await db
      .insert(users)
      .values({
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash,
        fullName: userData.fullName,
        avatarUrl: userData.avatarUrl,
      })
      .returning();
    return result[0];
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async addRole(userId: string, roleId: string): Promise<UserRole> {
    await db.insert(userRoles).values({ userId, roleId });
    return { userId, roleId };
  }

  async getRoles(userId: string): Promise<CatalogUserRole[]> {
    const result = await db
      .select({
        id: catalogUserRoles.id,
        name: catalogUserRoles.name,
        description: catalogUserRoles.description,
        createdAt: catalogUserRoles.createdAt,
      })
      .from(userRoles)
      .innerJoin(catalogUserRoles, eq(userRoles.roleId, catalogUserRoles.id))
      .where(eq(userRoles.userId, userId));
    return result;
  }

  async getGroupIds(userId: string): Promise<string[]> {
    const result = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    return result.map((r) => r.groupId);
  }
}
